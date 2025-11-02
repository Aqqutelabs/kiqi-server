import mongoose, { Schema, Document } from 'mongoose';
import { PublisherPlatform } from '../types/pressRelease.types';

interface PublisherDocument extends Document, Omit<PublisherPlatform, 'id'> {
    publisherId: string;  // We'll rename 'id' to 'publisherId' to avoid conflicts
}

const PublisherSchema = new Schema<PublisherDocument>({
    publisherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    avg_publish_time: { type: String, required: true },
    industry_focus: [{ type: String }],
    region_reach: [{ type: String }],
    audience_reach: { type: String, required: true },
    key_features: [{ type: String }],
    metrics: {
        domain_authority: { type: Number, required: false },
        trust_score: { type: Number, required: false },
        avg_traffic: { type: Number, required: false },
        social_signals: { type: Number, required: false }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
PublisherSchema.index({ industry_focus: 1 });
PublisherSchema.index({ region_reach: 1 });
PublisherSchema.index({ name: 'text' });

export const Publisher = mongoose.model<PublisherDocument>('Publisher', PublisherSchema);