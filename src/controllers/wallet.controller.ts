import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Wallet } from '../models/Wallet';
import { User } from '../models/User';

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
    walletName: string;
    walletAddress: string;
    status?: 'Active' | 'Inactive';
}

class WalletController {
    // Add a new wallet
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