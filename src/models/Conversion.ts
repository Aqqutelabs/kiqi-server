import mongoose, { Schema, Document } from 'mongoose';

export type ConversionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ConversionDocument extends Document {
    user_id: mongoose.Types.ObjectId;
    amount: number; // go_credits amount
    solana_wallet: string;
    status: ConversionStatus;
    requested_at: Date;
    resolved_at?: Date;
    admin_id?: mongoose.Types.ObjectId;
    reason?: string;
}

const ConversionSchema = new Schema<ConversionDocument>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    solana_wallet: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
    requested_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
    admin_id: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String }
}, {
    timestamps: true
});

ConversionSchema.index({ user_id: 1, status: 1 });

export const Conversion = mongoose.model<ConversionDocument>('Conversion', ConversionSchema);
