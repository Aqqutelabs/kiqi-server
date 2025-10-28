import mongoose, { Schema, Document } from 'mongoose';
import { PressReleaseListItem, PressReleaseMetrics, DistributionReportItem } from '../types/pressRelease.types';

interface PressReleaseDocument extends Document, PressReleaseListItem {
    metrics: PressReleaseMetrics;
    distribution_report: DistributionReportItem[];
    content: string;  // Rich text content
    campaign_id: Schema.Types.ObjectId;
}

const PressReleaseSchema = new Schema<PressReleaseDocument>({
    title: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Published', 'Draft', 'Scheduled'],
        required: true 
    },
    distribution: { type: String },
    campaign: { type: String, required: true },
    performance_views: { type: String },
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
    campaign_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Campaign',
        required: true 
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
PressReleaseSchema.index({ campaign_id: 1 });
PressReleaseSchema.index({ status: 1 });
PressReleaseSchema.index({ title: 'text' });

export const PressRelease = mongoose.model<PressReleaseDocument>('PressRelease', PressReleaseSchema);