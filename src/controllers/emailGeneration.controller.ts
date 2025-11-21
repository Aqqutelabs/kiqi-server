import { Request, Response } from 'express';
import { IEmailGenerationService } from '../services/emailGeneration.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';

export class EmailGenerationController {
  constructor(private readonly emailGenerationService: IEmailGenerationService) {}

  generateEmail = asyncHandler(async (req: Request, res: Response) => {
    const { context, tone, continueThread } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (!context) {
      throw new ApiError(400, 'Missing required field: context');
    }

    const email = await this.emailGenerationService.generateEmail(userId.toString(), {
      context,
      tone: tone || 'Professional',
      continueThread: !!continueThread,
    });

    // Remove recipient from response payload (we use userId for ownership)
    const toReturn: any = email.toObject ? email.toObject() : { ...email };
    if (toReturn.recipient) delete toReturn.recipient;

    // If content is stored as JSON string, parse it into subject/body
    try {
      if (typeof toReturn.content === 'string') {
        const parsed = JSON.parse(toReturn.content);
        toReturn.subject = parsed.subject;
        toReturn.body = parsed.body;
      }
    } catch (e) {
      // ignore parsing error and leave raw content
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

    if (!emailId || !instructions) {
      throw new ApiError(400, 'Missing required fields');
    }

    const email = await this.emailGenerationService.regenerateEmail(
      userId.toString(),
      emailId,
      instructions
    );

    res.status(200).json(
      new ApiResponse(200, email, 'Email regenerated successfully')
    );
  });
}