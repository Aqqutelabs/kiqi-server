import { GoogleAiService } from './GoogleAi.service';
import AIEmail, { IAIEmail } from '../models/AIEmail';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

export interface IEmailGenerationService {
  generateEmail(userId: string, data: {
    recipient: string;
    context: string;
    tone: string;
  }): Promise<IAIEmail>;
  regenerateEmail(userId: string, emailId: string, instructions: string): Promise<IAIEmail>;
}

export class EmailGenerationService implements IEmailGenerationService {
  private readonly googleAI: GoogleAiService;

  constructor(googleAI: GoogleAiService) {
    this.googleAI = googleAI;
  }

  async generateEmail(userId: string, data: {
    recipient: string;
    context: string;
    tone: string;
  }): Promise<IAIEmail> {
    try {
      const prompt = this.constructPrompt(data);
      const response = await this.googleAI.generateEmail(prompt);

      const email = new AIEmail({
        ...data,
        content: response.result,
        userId: new Types.ObjectId(userId),
      });

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

  private constructPrompt(data: { recipient: string; context: string; tone: string }): string {
    return `Write an email with the following specifications:
      - To: ${data.recipient}
      - Context: ${data.context}
      - Tone: ${data.tone}
      
      The email should be professional and well-structured. Include a clear subject line and proper email formatting.`;
  }

  private constructRegenerationPrompt(email: IAIEmail, instructions: string): string {
    return `Revise the following email based on these instructions: "${instructions}"
      
      Original email:
      ${email.content}
      
      Keep the same tone (${email.tone}) and context while applying the requested changes.`;
  }
}