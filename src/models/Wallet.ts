import mongoose, { Schema, Document, Types } from 'mongoose';
import { Wallet as IWallet } from '../types/account.types';

interface WalletDocument extends Document, Omit<IWallet, '_id'> {}

const WalletSchema = new Schema<WalletDocument>({
    user_id: { type: Types.ObjectId, ref: 'User', required: true },
    walletName: { type: String, required: true },
    walletAddress: { type: String, required: true },
    dateAdded: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'],
        default: 'Active' 
    },
    lastUsed: { type: Date }
}, {
    timestamps: true
});

// Compound index to ensure one wallet address per user
WalletSchema.index({ user_id: 1, walletAddress: 1 }, { unique: true });

export const Wallet = mongoose.model<WalletDocument>('Wallet', WalletSchema);