import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { SolanaService, isValidSolanaAddress } from '../utils/solana.service';
import config from '../config/config';

// Type for the authenticated user
interface AuthUser {
    _id: string;
    [key: string]: any;
}

// Extend Express Request type
interface AuthRequest extends Request {
    user: AuthUser;
}

// Type for the request handler
type AuthRequestHandler = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => Promise<any>;

// Wrapper to handle authentication type safety
const authHandler = (handler: AuthRequestHandler) => 
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user._id) {
            throw new ApiError(401, 'User not authenticated');
        }
        return await handler(req as AuthRequest, res, next);
    });

class PhantomWalletController {
    // Connect Phantom wallet
    connectPhantomWallet = authHandler(async (req: AuthRequest, res: Response) => {
        const { publicKey } = req.body;

        if (!isValidSolanaAddress(publicKey)) {
            throw new ApiError(400, "Invalid Solana address provided");
        }

        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        // Get or create associated token account
        const tokenAccount = await SolanaService.getOrCreateAssociatedTokenAccount(publicKey);

        wallet.phantom_wallet = {
            public_key: publicKey,
            is_connected: true,
            last_connected: new Date(),
            token_account: tokenAccount.address
        };

        await wallet.save();

        return res.json(new ApiResponse(200, { wallet }, "Phantom wallet connected successfully"));
    });

    // Disconnect Phantom wallet
    disconnectPhantomWallet = authHandler(async (req: AuthRequest, res: Response) => {
        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (!wallet.phantom_wallet?.is_connected) {
            throw new ApiError(400, "No Phantom wallet is currently connected");
        }

        wallet.phantom_wallet.is_connected = false;
        await wallet.save();

        return res.json(new ApiResponse(200, null, "Phantom wallet disconnected successfully"));
    });

    // Get Phantom wallet balance
    getPhantomBalance = authHandler(async (req: AuthRequest, res: Response) => {
        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (!wallet.phantom_wallet?.is_connected) {
            throw new ApiError(400, "No Phantom wallet is currently connected");
        }

        const balance = await SolanaService.getGoCoinBalance(wallet.phantom_wallet.token_account!);

        return res.json(new ApiResponse(200, { balance }, "Balance retrieved successfully"));
    });

    // Transfer GoCoins to Phantom wallet
    transferToPhantom = authHandler(async (req: AuthRequest, res: Response) => {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            throw new ApiError(400, "Invalid amount");
        }

        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (!wallet.phantom_wallet?.is_connected) {
            throw new ApiError(400, "No Phantom wallet is currently connected");
        }

        if (wallet.go_coins < amount) {
            throw new ApiError(400, "Insufficient GoCoins balance");
        }

        // Create transfer instructions
        const transferInstructions = await SolanaService.createTransferInstructions(
            config.solana.goWallet.publicKey,
            wallet.phantom_wallet.public_key,
            amount
        );

        // Deduct from internal wallet first
        wallet.go_coins -= amount;
        await wallet.save();

        // Create transaction record
        await Transaction.create({
            user_id: req.user._id,
            amount,
            type: 'Transfer',
            currency_type: 'go_coins',
            status: 'Pending',
            description: 'Transfer to Phantom wallet',
            metadata: {
                phantom_wallet: wallet.phantom_wallet.public_key,
                token_account: wallet.phantom_wallet.token_account,
                transfer_instructions: transferInstructions
            }
        });

        return res.json(new ApiResponse(200, { 
            transferInstructions,
            wallet 
        }, "Transfer instructions created successfully"));
    });

    // Verify Phantom transfer
    verifyPhantomTransfer = authHandler(async (req: AuthRequest, res: Response) => {
        const { signature, transactionId } = req.body;

        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            throw new ApiError(404, "Transaction not found");
        }

        const isValid = await SolanaService.verifyTransaction(signature);

        if (isValid) {
            transaction.status = 'Completed';
            await transaction.save();
            
            return res.json(new ApiResponse(200, { transaction }, "Transfer verified successfully"));
        } else {
            // Revert the transfer if verification fails
            const wallet = await Wallet.findOne({ user_id: req.user._id });
            if (wallet) {
                wallet.go_coins += transaction.amount;
                await wallet.save();
            }

            transaction.status = 'Failed';
            await transaction.save();

            throw new ApiError(400, "Transfer verification failed");
        }
    });

    // Get Phantom transaction history
    getPhantomTransactions = authHandler(async (req: AuthRequest, res: Response) => {
        const wallet = await Wallet.findOne({ user_id: req.user._id });
        
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }

        if (!wallet.phantom_wallet?.is_connected) {
            throw new ApiError(400, "No Phantom wallet is currently connected");
        }

        const transactions = await SolanaService.getTokenTransactionHistory(
            wallet.phantom_wallet.token_account!
        );

        return res.json(new ApiResponse(200, { transactions }, "Transaction history retrieved successfully"));
    });
}

export default new PhantomWalletController();