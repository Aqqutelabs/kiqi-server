import mongoose, { Schema, Document, Types } from 'mongoose';
import { Wallet as IWallet } from '../types/account.types';

interface WalletDocument extends Document, Omit<IWallet, '_id'> {
    user_id: mongoose.Types.ObjectId;
    go_credits: number;
    go_coins: number;
    monthly_limit: number;
    total_spent: number;
    total_earned_coins: number;
    avg_monthly_spend: number;
    wallet_address?: string;
    phantom_wallet?: {
        public_key: string;
        is_connected: boolean;
        last_connected: Date;
        token_account?: string;  // SPL token account address
    };
    status: 'Active' | 'Inactive';
    created_at: Date;
    updated_at: Date;
}

const WalletSchema = new Schema<WalletDocument>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    go_credits: { type: Number, default: 0 },
    go_coins: { type: Number, default: 0 },
    monthly_limit: { type: Number, default: 5000 }, // Default to Starter plan limit
    total_spent: { type: Number, default: 0 },
    total_earned_coins: { type: Number, default: 0 },
    avg_monthly_spend: { type: Number, default: 0 },
    wallet_address: { type: String },
    phantom_wallet: {
        public_key: { type: String },
        is_connected: { type: Boolean, default: false },
        last_connected: { type: Date },
        token_account: { type: String }, // SPL token account address
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'],
        default: 'Active' 
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index for Phantom wallet queries
WalletSchema.index({ 'phantom_wallet.public_key': 1 });

// Compound index to ensure one wallet address per user
WalletSchema.index({ user_id: 1, walletAddress: 1 }, { unique: true });

export const Wallet = mongoose.model<WalletDocument>('Wallet', WalletSchema);