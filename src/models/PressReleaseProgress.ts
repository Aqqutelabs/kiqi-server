import mongoose, { Schema, Document } from 'mongoose';

export type ProgressStep = 'initiated' | 'payment_pending' | 'payment_completed' | 'under_review' | 'approved' | 'rejected';

export interface ProgressRecord {
    step: ProgressStep;
    timestamp: Date;
    notes?: string;
    metadata?: {
        payment_reference?: string;
        order_id?: string;
        reviewer_name?: string;
        rejection_reason?: string;
    };
}

interface PressReleaseProgressDocument extends Document {
    press_release_id: Schema.Types.ObjectId;
    user_id: Schema.Types.ObjectId;
    current_step: ProgressStep;
    progress_history: ProgressRecord[];
    initiated_at: Date;
    payment_completed_at?: Date;
    under_review_at?: Date;
    completed_at?: Date;
    rejected_at?: Date;
    rejection_reason?: string;
    created_at: Date;
    updated_at: Date;
}

const ProgressRecordSchema = new Schema<ProgressRecord>(
    {
        step: {
            type: String,
            enum: ['initiated', 'payment_pending', 'payment_completed', 'under_review', 'approved', 'rejected'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true
        },
        notes: String,
        metadata: {
            payment_reference: String,
            order_id: String,
            reviewer_name: String,
            rejection_reason: String
        }
    },
    { _id: false }
);

const PressReleaseProgressSchema = new Schema<PressReleaseProgressDocument>(
    {
        press_release_id: {
            type: Schema.Types.ObjectId,
            ref: 'PressRelease',
            required: true,
            index: true
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        current_step: {
            type: String,
            enum: ['initiated', 'payment_pending', 'payment_completed', 'under_review', 'approved', 'rejected'],
            default: 'initiated'
        },
        progress_history: {
            type: [ProgressRecordSchema],
            default: []
        },
        initiated_at: {
            type: Date,
            default: Date.now
        },
        payment_completed_at: Date,
        under_review_at: Date,
        completed_at: Date,
        rejected_at: Date,
        rejection_reason: String,
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Indexes for efficient querying
PressReleaseProgressSchema.index({ press_release_id: 1, user_id: 1 });
PressReleaseProgressSchema.index({ user_id: 1, current_step: 1 });
PressReleaseProgressSchema.index({ current_step: 1 });
PressReleaseProgressSchema.index({ 'progress_history.step': 1 });

export const PressReleaseProgress = mongoose.model<PressReleaseProgressDocument>(
    'PressReleaseProgress',
    PressReleaseProgressSchema
);
