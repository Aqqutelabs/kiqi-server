import mongoose, { Schema, Document } from 'mongoose';
import { CheckoutOrder } from '../types/pressRelease.types';

interface OrderDocument extends Document, Omit<CheckoutOrder, 'payment_methods'> {
    user_id: Schema.Types.ObjectId;
    items: Array<{
        publisherId: string;
        name: string;
        price: string;
        selected: boolean;
    }>;
    status: 'Pending' | 'Completed' | 'Failed';
    payment_method: string;
    payment_status?: 'Pending' | 'Successful' | 'Failed';
    reference: string;
    transaction_id?: string;
}

const OrderSchema = new Schema<OrderDocument>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        publisherId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: String, required: true },
        selected: { type: Boolean, default: true }
    }],
    order_summary: {
        subtotal: { type: String, required: true },
        vat_percentage: { type: String, required: true },
        vat_amount: { type: String, required: true },
        total_amount: { type: String, required: true }
    },
    reference: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Successful', 'Failed'],
        default: 'Pending'
    },
    payment_method: {
        type: String,
        required: true
    },
    transaction_id: String
}, {
    timestamps: true
});

// Indexes for efficient queries
OrderSchema.index({ user_id: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ created_at: -1 });

export const Order = mongoose.model<OrderDocument>('Order', OrderSchema);