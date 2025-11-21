import { GoogleAiService } from './GoogleAi.service';
import AIEmail, { IAIEmail } from '../models/AIEmail';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

export interface IEmailGenerationService {
  generateEmail(userId: string, data: {
    context: string;
    tone?: string;
    continueThread?: boolean;
  }): Promise<IAIEmail>;
  regenerateEmail(userId: string, emailId: string, instructions: string): Promise<IAIEmail>;
}

export class EmailGenerationService implements IEmailGenerationService {
  private readonly googleAI: GoogleAiService;

  constructor(googleAI: GoogleAiService) {
    this.googleAI = googleAI;
  }

  async generateEmail(userId: string, data: {
    context: string;
    tone?: string;
    continueThread?: boolean;
  }): Promise<IAIEmail> {
    try {
      // If continueThread is true, fetch the most recent email thread for this user
      let existingEmail: IAIEmail | null = null;
      if (data.continueThread) {
        existingEmail = await AIEmail.findOne({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 }).exec();
        if (!existingEmail) {
          // No thread to continue; treat as new email rather than error
          existingEmail = null;
        }
      }

      const prompt = this.constructPrompt({ context: data.context, tone: data.tone || 'Professional' }, existingEmail ?? undefined);
      const response = await this.googleAI.generateEmail(prompt);

      // Try to parse the AI response as JSON { subject, body }
      let subject = '';
      let body = '';
      try {
        const parsed = JSON.parse(String(response.result));
        subject = parsed.subject || '';
        body = parsed.body || parsed.content || '';
      } catch (e) {
        // Fallback: try to split by a Subject: line
        const text = String(response.result || '');
        const subjMatch = text.match(/Subject:\s*(.*)/i);
        if (subjMatch) {
          subject = subjMatch[1].trim();
          body = text.replace(subjMatch[0], '').trim();
        } else {
          // If no subject line, take first line as subject and rest as body
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length > 0) {
            subject = lines[0].trim();
            body = lines.slice(1).join('\n').trim();
          } else {
            body = text;
          }
        }
      }

      const emailPayload: any = {
        context: data.context,
        tone: data.tone || 'Professional',
        // Store structured content as JSON string for consistency
        content: JSON.stringify({ subject, body }),
        userId: new Types.ObjectId(userId),
      };

      // If continuing a conversation, update the existing email by appending the new content
      if (existingEmail) {
        // Append continued reply as structured JSON content: merge previous and new
        try {
          const prev = JSON.parse(String(existingEmail.content || '{}'));
          const newContent = { subject: subject || prev.subject || '', body: `${prev.body || ''}\n\n--- Reply continued ---\n\n${body}` };
          existingEmail.content = JSON.stringify(newContent);
        } catch (e) {
          existingEmail.content = `${existingEmail.content}\n\n--- Reply continued ---\n\n${response.result}`;
        }
        existingEmail.updatedAt = new Date();
        await existingEmail.save();
        return existingEmail;
      }

      const email = new AIEmail(emailPayload);
      await email.save();
      return email;
    } catch (error) {
  console.error('Error in generateEmail:', error);
  throw new ApiError(500, 'Failed to generate email');
    }
  }

  async regenerateEmail(userId: string, emailId: string, instructions: string): Promise<IAIEmail> {
    try {
      const existingEmail = await AIEmail.findOne({
        _id: emailId,
        userId: new Types.ObjectId(userId),
      });

      if (!existingEmail) {
        throw new ApiError(404, 'Email not found');
      }

      const prompt = this.constructRegenerationPrompt(existingEmail, instructions);
      const response = await this.googleAI.regenerateEmail(emailId, prompt);

      existingEmail.content = response.regenerated.toString();
      await existingEmail.save();

      return existingEmail;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to regenerate email');
    }
  }

  private constructPrompt(data: { context: string; tone: string }, existingEmail?: IAIEmail): string {
    // System instruction: set role and quality expectations
    const system = `You are a professional email copywriter for an email campaign application. Produce clear, well-structured, high-quality email copy suitable for real-world campaigns. Use a professional tone, a concise but descriptive subject line, and a body that reads naturally. Keep length moderate (not verbose), use good grammar, and avoid placeholders like [Your Name].`;

    let prompt = `${system}\n\nContext: ${data.context}\nTone: ${data.tone}\n\nPlease return only the subject and the body. Do not include any recipient lines or metadata.`;

    if (existingEmail) {
      prompt = `${system}\n\nThis is a continuation of the following email thread. Use the original content as context and continue the conversation, keeping the same professional quality.\n\nOriginal email:\n${existingEmail.content}\n\nNew context/instructions: ${data.context}\n\nPlease return only the subject and the body for the continued message.`;
    }

    return prompt;
  }

  private constructRegenerationPrompt(email: IAIEmail, instructions: string): string {
    return `Revise the following email based on these instructions: "${instructions}"
      
      Original email:
      ${email.content}
      
      Keep the same tone (${email.tone}) and context while applying the requested changes.`;
  }
}