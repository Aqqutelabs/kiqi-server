import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Wallet } from '../models/Wallet';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Subscription } from '../models/Subscription';

// Extend Express types for authenticated requests
type AuthUser = User & { _id: string };

interface AuthRequest extends Request {
    user: AuthUser;
}

type AuthHandler = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => Promise<any>;

const authHandler = (fn: AuthHandler) => 
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        return await fn(req as AuthRequest, res, next);
    });

interface WalletInput {
    walletName?: string;
    walletAddress?: string;
    amount?: number;
    status?: 'Active' | 'Inactive';
}

class WalletController {
    // Get wallet balance
    getWalletBalance = authHandler(async (req: AuthRequest, res: Response) => {
        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        return res.json(new ApiResponse(200, {
            go_credits: wallet.go_credits,
            go_coins: wallet.go_coins,
            monthly_limit: wallet.monthly_limit,
            total_spent: wallet.total_spent,
            avg_monthly_spend: wallet.avg_monthly_spend
        }, "Wallet balance retrieved successfully"));
    });

    // Add credits to wallet
    addCredits = authHandler(async (req: AuthRequest, res: Response) => {
        const { amount } = req.body as WalletInput;

        if (!amount || amount <= 0) {
            throw new ApiError(400, "Invalid amount");
        }

        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        wallet.go_credits += amount;
        await wallet.save();

        // Create transaction record
        await Transaction.create({
            user_id: req.user._id,
            amount,
            type: 'Credit',
            currency_type: 'go_credits',
            status: 'Completed',
            description: 'Credits added to wallet'
        });

        return res.json(new ApiResponse(200, { wallet }, "Credits added successfully"));
    });

    // Add a new wallet
    // Deduct credits from wallet
    deductCredits = authHandler(async (req: AuthRequest, res: Response) => {
        const { amount } = req.body as WalletInput;

        if (!amount || amount <= 0) {
            throw new ApiError(400, "Invalid amount");
        }

        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (wallet.go_credits < amount) {
            throw new ApiError(400, "Insufficient credits");
        }

        // Check monthly limit
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const monthlySpent = await Transaction.aggregate([
            {
                $match: {
                    user_id: req.user._id,
                    type: 'Debit',
                    currency_type: 'go_credits',
                    created_at: { $gte: firstDayOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalSpentThisMonth = (monthlySpent[0]?.total || 0) + amount;
        if (totalSpentThisMonth > wallet.monthly_limit) {
            throw new ApiError(400, "Monthly spending limit exceeded");
        }

        wallet.go_credits -= amount;
        wallet.total_spent += amount;
        await wallet.save();

        // Create transaction record
        await Transaction.create({
            user_id: req.user._id,
            amount,
            type: 'Debit',
            currency_type: 'go_credits',
            status: 'Completed',
            description: 'Credits deducted from wallet'
        });

        return res.json(new ApiResponse(200, { wallet }, "Credits deducted successfully"));
    });

    // Convert credits to coins
    convertCreditsToCoins = authHandler(async (req: AuthRequest, res: Response) => {
        const { amount } = req.body as WalletInput;

        if (!amount || amount <= 0) {
            throw new ApiError(400, "Invalid amount");
        }

        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (wallet.go_credits < amount) {
            throw new ApiError(400, "Insufficient credits");
        }

        // Get user's subscription for coin multiplier
        const subscription = await Subscription.findOne({
            user_id: req.user._id,
            status: 'Active'
        });

        const multiplier = subscription?.coinMultiplier || 1;
        const coinsToAdd = amount * multiplier;

        wallet.go_credits -= amount;
        wallet.go_coins += coinsToAdd;
        await wallet.save();

        // Create transaction records
        await Transaction.create([
            {
                user_id: req.user._id,
                amount,
                type: 'Conversion',
                currency_type: 'go_credits',
                status: 'Completed',
                description: 'Credits converted to coins'
            },
            {
                user_id: req.user._id,
                amount: coinsToAdd,
                type: 'Conversion',
                currency_type: 'go_coins',
                status: 'Completed',
                description: 'Coins received from conversion'
            }
        ]);

        return res.json(new ApiResponse(200, { 
            wallet,
            converted: {
                credits: amount,
                coins: coinsToAdd,
                multiplier
            }
        }, "Credits converted to coins successfully"));
    });

    // Get transaction history
    getTransactionHistory = authHandler(async (req: AuthRequest, res: Response) => {
        const { currency_type, type, startDate, endDate, page = 1, limit = 10 } = req.query;

        const query: any = {
            user_id: req.user._id
        };

        if (currency_type) {
            query.currency_type = currency_type;
        }

        if (type) {
            query.type = type;
        }

        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const transactions = await Transaction.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Transaction.countDocuments(query);

        return res.json(new ApiResponse(200, {
            transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }, "Transaction history retrieved successfully"));
    });

    addWallet = authHandler(async (req: AuthRequest, res: Response) => {
        const { walletName, walletAddress, status } = req.body as WalletInput;

        // Check if wallet already exists for this user
        const existingWallet = await Wallet.findOne({
            user_id: req.user._id,
            walletAddress
        });

        if (existingWallet) {
            throw new ApiError(400, "Wallet with this address already exists");
        }

        const wallet = await Wallet.create({
            user_id: req.user._id,
            walletName,
            walletAddress,
            status: status || 'Active'
        });

        return res
            .status(201)
            .json(new ApiResponse(201, wallet, "Wallet added successfully"));
    });

    // Get all wallets
    getWallets = authHandler(async (req: AuthRequest, res: Response) => {
        const wallets = await Wallet.find({ user_id: req.user._id })
            .select('-__v')
            .sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, wallets, "Wallets retrieved successfully"));
    });

    // Update wallet
    updateWallet = authHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { walletName, status } = req.body as Partial<WalletInput>;

        // Verify wallet ownership
        const wallet = await Wallet.findOne({ _id: id, user_id: req.user._id });
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        const updatedWallet = await Wallet.findByIdAndUpdate(
            id,
            {
                ...(walletName && { walletName }),
                ...(status && { status })
            },
            { new: true }
        );

        if (!updatedWallet) {
            throw new ApiError(404, "Failed to update wallet");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedWallet, "Wallet updated successfully"));
    });

    // Delete wallet
    deleteWallet = authHandler(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        const wallet = await Wallet.findOne({ _id: id, user_id: req.user._id });
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Check if wallet has any active transactions before deleting
        if (wallet.status === 'Active') {
            wallet.status = 'Inactive';
            await wallet.save();
        } else {
            await wallet.deleteOne();
        }

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Wallet deleted successfully"));
    });
}

export const walletController = new WalletController();