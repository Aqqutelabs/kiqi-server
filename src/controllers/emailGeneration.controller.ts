import { Request, Response } from 'express';
import { IEmailGenerationService } from '../services/emailGeneration.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';

export class EmailGenerationController {
  constructor(private readonly emailGenerationService: IEmailGenerationService) {}

  generateEmail = asyncHandler(async (req: Request, res: Response) => {
    const { context, tone } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Validation
    if (!context || typeof context !== 'string') {
      throw new ApiError(400, 'Context is required and must be a string');
    }

    if (context.trim().length === 0) {
      throw new ApiError(400, 'Context cannot be empty');
    }

    if (context.trim().length > 5000) {
      throw new ApiError(400, 'Context is too long (max 5000 characters)');
    }

    const email = await this.emailGenerationService.generateEmail(userId.toString(), {
      context: context.trim(),
      tone: tone || 'Professional',
    });

    // Remove recipient from response payload (we use userId for ownership)
    const toReturn: any = email.toObject ? email.toObject() : { ...email };
    if (toReturn.recipient) delete toReturn.recipient;

    // Parse content into subject/body if stored as JSON string
    if (typeof toReturn.content === 'string') {
      try {
        const parsed = JSON.parse(toReturn.content);
        toReturn.subject = parsed.subject || '';
        toReturn.body = parsed.body || '';
      } catch (e) {
        console.error('Failed to parse email content:', e);
        toReturn.body = toReturn.content;
      }
    }

    res.status(201).json(
      new ApiResponse(201, toReturn, 'Email generated successfully')
    );
  });

  regenerateEmail = asyncHandler(async (req: Request, res: Response) => {
    const { emailId, instructions } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Validation
    if (!emailId || typeof emailId !== 'string') {
      throw new ApiError(400, 'Email ID is required and must be a string');
    }

    if (!instructions || typeof instructions !== 'string') {
      throw new ApiError(400, 'Instructions are required and must be a string');
    }

    if (instructions.trim().length === 0) {
      throw new ApiError(400, 'Instructions cannot be empty');
    }

    if (instructions.trim().length > 2000) {
      throw new ApiError(400, 'Instructions are too long (max 2000 characters)');
    }

    const email = await this.emailGenerationService.regenerateEmail(
      userId.toString(),
      emailId,
      instructions.trim()
    );

    // Remove recipient from response payload
    const toReturn: any = email.toObject ? email.toObject() : { ...email };
    if (toReturn.recipient) delete toReturn.recipient;

    // Parse content into subject/body if stored as JSON string
    if (typeof toReturn.content === 'string') {
      try {
        const parsed = JSON.parse(toReturn.content);
        toReturn.subject = parsed.subject || '';
        toReturn.body = parsed.body || '';
      } catch (e) {
        console.error('Failed to parse regenerated email content:', e);
        toReturn.body = toReturn.content;
      }
    }

    res.status(200).json(
      new ApiResponse(200, toReturn, 'Email regenerated successfully')
    );
  });
}