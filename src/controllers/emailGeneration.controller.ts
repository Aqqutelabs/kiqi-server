import { Request, Response } from 'express';
import { IEmailGenerationService } from '../services/emailGeneration.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';

export class EmailGenerationController {
  constructor(private readonly emailGenerationService: IEmailGenerationService) {}

  generateEmail = asyncHandler(async (req: Request, res: Response) => {
    const { recipient, context, tone } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (!recipient || !context || !tone) {
      throw new ApiError(400, 'Missing required fields');
    }

    const email = await this.emailGenerationService.generateEmail(userId.toString(), {
      recipient,
      context,
      tone,
    });

    res.status(201).json(
      new ApiResponse(201, email, 'Email generated successfully')
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