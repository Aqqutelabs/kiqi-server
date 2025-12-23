import mongoose, { Schema, Document } from 'mongoose';
import { PressReleaseListItem, PressReleaseMetrics, DistributionReportItem } from '../types/pressRelease.types';

interface PressReleaseDocument extends Document, PressReleaseListItem {
    metrics: PressReleaseMetrics;
    distribution_report: DistributionReportItem[];
    content: string;  // Rich text content
    user_id: Schema.Types.ObjectId;
    image?: string;
    tracker?: {
        current_status: 'completed' | 'pending' | 'processing' | 'review' | 'rejected';
        status_history: Array<{
            status: string;
            timestamp: Date;
            notes?: string;
        }>;
        progress_percentage: number;
        estimated_completion: Date;
        actual_completion?: Date;
        reviewers_count: number;
    };
}

const PressReleaseSchema = new Schema<PressReleaseDocument>({
    status: { 
        type: String, 
        enum: ['Published', 'Draft', 'Scheduled'],
        required: true 
    },
    distribution: { type: String },
    performance_views: { type: String },
    title: { type: String, required: true },
    campaign: { type: String },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    date_created: { type: String, required: true },
    metrics: {
        total_views: { type: Number, default: 0 },
        total_clicks: { type: Number, default: 0 },
        engagement_rate: { type: String, default: '0%' },
        avg_time_on_page: { type: String, default: '0:00' }
    },
    distribution_report: [{
        outlet_name: { type: String, required: true },
        outlet_status: { 
            type: String, 
            enum: ['Published', 'Pending'],
            required: true 
        },
        outlet_clicks: { type: Number, default: 0 },
        outlet_views: { type: String, default: '0' },
        publication_link: { type: String },
        publication_date: { type: String }
    }],
    content: { type: String, required: true },
    image: { type: String }, // Added optional image field
    tracker: {
        current_status: {
            type: String,
            enum: ['completed', 'pending', 'processing', 'review', 'rejected'],
            default: 'pending'
        },
        status_history: [{
            status: String,
            timestamp: { type: Date, default: Date.now },
            notes: String
        }],
        progress_percentage: { type: Number, default: 0 },
        estimated_completion: Date,
        actual_completion: Date,
        reviewers_count: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
PressReleaseSchema.index({ status: 1 });
PressReleaseSchema.index({ title: 'text' });
PressReleaseSchema.index({ user_id: 1 });
PressReleaseSchema.index({ 'tracker.current_status': 1 });

export const PressRelease = mongoose.model<PressReleaseDocument>('PressRelease', PressReleaseSchema);