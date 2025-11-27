import { Request, Response } from 'express';
import { verifyJWT, AuthRequest } from '../middlewares/Auth.middlewares';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { Transaction } from '../models/Transaction';

// Return all transactions for the authenticated user
export const getUserTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

  // Fetch all transactions for this user, newest first
  const transactions = await Transaction.find({ user_id: userId }).sort({ dateCreated: -1 });

  return res.json(new ApiResponse(200, transactions, 'User transactions retrieved'));
});

export default { getUserTransactions };
