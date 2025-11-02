import mongoose, { Schema, Document } from 'mongoose';
import { Card as ICard } from '../types/account.types';

interface CardDocument extends Document, Omit<ICard, '_id'> {}

const CardSchema = new Schema<CardDocument>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cardType: { 
        type: String, 
        enum: ['MasterCard', 'Visa'],
        required: true 
    },
    last4Digits: { type: String, required: true },
    cardHolderName: { type: String, required: true },
    dateAdded: { type: Date, default: Date.now },
    expiryDate: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['Active', 'Expired', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Ensure only one default card per user
CardSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.model('Card').updateMany(
            { user_id: this.user_id, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

export const Card = mongoose.model<CardDocument>('Card', CardSchema);