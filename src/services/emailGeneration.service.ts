import { GoogleAiService } from './GoogleAi.service';
import AIEmail, { IAIEmail } from '../models/AIEmail';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

export interface IEmailGenerationService {
  generateEmail(userId: string, data: {
    context: string;
    tone?: string;
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
  }): Promise<IAIEmail> {
    try {
      // Validate inputs
      if (!data.context || data.context.trim().length === 0) {
        throw new ApiError(400, 'Context cannot be empty');
      }

      const validTones = ['Professional', 'Casual', 'Friendly', 'Formal'];
      const tone = data.tone || 'Professional';
      if (!validTones.includes(tone)) {
        throw new ApiError(400, `Invalid tone. Must be one of: ${validTones.join(', ')}`);
      }

      // Automatically fetch previous emails from this user to provide context (like a real chat app)
      const previousEmails = await AIEmail.find({ userId: new Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .limit(5)
        .exec();

      const prompt = this.constructPrompt({ context: data.context.trim(), tone }, previousEmails);
      const response = await this.googleAI.generateEmail(prompt);

      // Parse the AI response robustly
      const { subject, body } = this.parseEmailResponse(String(response.result || ''));

      // Create a new email with the generated content
      const emailPayload: any = {
        context: data.context.trim(),
        tone,
        content: JSON.stringify({ subject, body }),
        userId: new Types.ObjectId(userId),
      };

      const email = new AIEmail(emailPayload);
      await email.save();
      return email;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error in generateEmail:', error);
      throw new ApiError(500, 'Failed to generate email');
    }
  }

  private parseEmailResponse(response: string): { subject: string; body: string } {
    // Trim whitespace
    response = response.trim();

    // Remove markdown code blocks if present (e.g., ```json ... ```)
    let cleanedResponse = response.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    if (cleanedResponse !== response) {
      cleanedResponse = cleanedResponse.trim();
    }

    // Try to parse as JSON first { subject, body }
    try {
      const parsed = JSON.parse(cleanedResponse);
      if (parsed.subject && parsed.body) {
        return {
          subject: String(parsed.subject || '').trim(),
          body: String(parsed.body || parsed.content || '').trim(),
        };
      }
    } catch (e) {
      // Not JSON, continue to fallback parsing
    }

    // Fallback 1: Look for JSON object within the response
    const jsonMatch = response.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.subject && parsed.body) {
          return {
            subject: String(parsed.subject || '').trim(),
            body: String(parsed.body || parsed.content || '').trim(),
          };
        }
      } catch (e) {
        // Continue to next fallback
      }
    }

    // Fallback 2: Look for "Subject:" prefix
    const subjMatch = cleanedResponse.match(/^Subject:\s*(.+?)(?:\n|$)/i);
    if (subjMatch) {
      const subject = subjMatch[1].trim();
      const bodyStart = cleanedResponse.indexOf(subjMatch[0]) + subjMatch[0].length;
      const body = cleanedResponse.substring(bodyStart).trim();
      if (body) {
        return { subject, body };
      }
    }

    // Fallback 3: Split by first blank line (subject vs body)
    const parts = cleanedResponse.split(/\n\s*\n/);
    if (parts.length >= 2) {
      const subject = parts[0].trim();
      const body = parts.slice(1).join('\n\n').trim();
      if (subject && body) {
        return { subject, body };
      }
    }

    // Fallback 4: Use first line as subject, rest as body
    const lines = cleanedResponse.split(/\n/).filter((line) => line.trim());
    if (lines.length > 1) {
      return {
        subject: lines[0].trim(),
        body: lines.slice(1).join('\n').trim(),
      };
    }

    // Fallback 5: Just use the entire response as body with a generic subject
    return {
      subject: 'Generated Email',
      body: cleanedResponse || 'No content generated',
    };
  }

  async regenerateEmail(userId: string, emailId: string, instructions: string): Promise<IAIEmail> {
    try {
      const existingEmail = await AIEmail.findOne({
        _id: emailId,
        userId: new Types.ObjectId(userId),
      });

      if (!existingEmail) {
        throw new ApiError(404, 'Email not found or you do not have permission to access it');
      }

      const prompt = this.constructRegenerationPrompt(existingEmail, instructions);
      const response = await this.googleAI.regenerateEmail(emailId, prompt);

      // Parse the regenerated response properly
      const { subject, body } = this.parseEmailResponse(String(response.regenerated || ''));

      existingEmail.content = JSON.stringify({ subject, body });
      existingEmail.updatedAt = new Date();
      await existingEmail.save();

      return existingEmail;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error in regenerateEmail:', error);
      throw new ApiError(500, 'Failed to regenerate email');
    }
  }

  private constructPrompt(data: { context: string; tone: string }, previousEmails?: IAIEmail[]): string {
    // System instruction: set role and quality expectations with explicit format requirement
    const system = `You are a professional email copywriter for an email campaign application. Your response MUST be in valid JSON format with exactly these fields:
{
  "subject": "A clear, concise email subject line (5-10 words)",
  "body": "The email body text, well-formatted and professional"
}

Guidelines:
- Use the specified tone (${data.tone})
- Write clear, concise, professional copy suitable for real-world campaigns
- Keep the subject line under 60 characters
- Keep the body moderate length, easy to read, with good grammar
- Avoid placeholder text like [Your Name] or [Company]
- Do NOT include any metadata, recipient lines, or explanations
- Do NOT include markdown or special formatting unless necessary
- Return ONLY valid JSON, nothing else`;

    // Build conversation context from previous emails if available
    let conversationContext = '';
    if (previousEmails && previousEmails.length > 0) {
      conversationContext = `\n\nPrevious conversation history (for context only):\n`;
      // Show in chronological order (oldest first)
      previousEmails.reverse().forEach((email, idx) => {
        try {
          const content = JSON.parse(String(email.content || '{}'));
          conversationContext += `\n[Previous ${idx + 1}]\nSubject: ${content.subject || 'N/A'}\nBody: ${content.body || 'N/A'}\n`;
        } catch (e) {
          conversationContext += `\n[Previous ${idx + 1}]\n${email.content || 'N/A'}\n`;
        }
      });
      conversationContext += `\nUse the above conversation history to maintain context and generate a coherent follow-up email.`;
    }

    return `${system}${conversationContext}\n\nNew request: ${data.context}\n\nGenerate a professional email based on this request and the conversation history above. Maintain consistency with the conversation tone and style. Return ONLY the JSON object with no additional text.`;
  }

  private constructRegenerationPrompt(email: IAIEmail, instructions: string): string {
    // Parse existing email content
    let existingContent = '';
    try {
      const parsed = JSON.parse(String(email.content || '{}'));
      existingContent = `Subject: ${parsed.subject || 'N/A'}\n\nBody:\n${parsed.body || 'N/A'}`;
    } catch (e) {
      existingContent = String(email.content || '');
    }

    return `You are a professional email copywriter. Your response MUST be in valid JSON format with exactly these fields:
{
  "subject": "A clear, concise email subject line",
  "body": "The updated email body text"
}

Revise the following email based on these instructions: "${instructions}"

Original email:
${existingContent}

Keep the same tone (${email.tone}) and context while applying the requested changes.

Return ONLY the JSON object with no additional text or explanation.`;
  }
}