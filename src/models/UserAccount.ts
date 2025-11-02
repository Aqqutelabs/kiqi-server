import mongoose, { Schema, Document } from 'mongoose';
import { AccountBalance } from '../types/account.types';

interface UserAccountDocument extends Document {
    user_id: Schema.Types.ObjectId;
    balance: number;
    totalReceived: number;
    totalSpent: number;
    lastBalanceUpdate: Date;
    lastMonthBalance: number;  // For calculating month-over-month change
}

const UserAccountSchema = new Schema<UserAccountDocument>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    totalReceived: { type: Number, required: true, default: 0 },
    totalSpent: { type: Number, required: true, default: 0 },
    lastBalanceUpdate: { type: Date, default: Date.now },
    lastMonthBalance: { type: Number, required: true, default: 0 }
}, {
    timestamps: true
});

// Methods to calculate balance change
UserAccountSchema.methods.getBalanceChange = function(): string {
    if (this.lastMonthBalance === 0) return '0% than last month';
    const change = ((this.balance - this.lastMonthBalance) / this.lastMonthBalance) * 100;
    return `${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'more' : 'less'} than last month`;
};

// Update lastMonthBalance at the start of each month
UserAccountSchema.pre('save', function(next) {
    const now = new Date();
    const lastUpdate = this.lastBalanceUpdate;
    
    if (now.getMonth() !== lastUpdate.getMonth() || now.getFullYear() !== lastUpdate.getFullYear()) {
        this.lastMonthBalance = this.balance;
    }
    
    this.lastBalanceUpdate = now;
    next();
});

export const UserAccount = mongoose.model<UserAccountDocument>('UserAccount', UserAccountSchema);