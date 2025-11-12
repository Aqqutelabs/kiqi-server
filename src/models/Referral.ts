import mongoose, { Schema, Document } from 'mongoose';

export interface ReferralTier {
    name: string;
    required_referrals: number;
    bonus_reward: number;
}

export interface ReferralDocument extends Document {
    referrer_id: mongoose.Types.ObjectId;
    referred_id: mongoose.Types.ObjectId;
    referral_code: string;
    plan_subscribed: string;
    coins_earned: number;
    status: 'pending' | 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}

const ReferralSchema = new Schema<ReferralDocument>({
    referrer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referred_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referral_code: { type: String, required: true },
    plan_subscribed: { type: String },
    coins_earned: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Update timestamp on save
ReferralSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Indexes for efficient queries
ReferralSchema.index({ referrer_id: 1, status: 1 });
ReferralSchema.index({ referral_code: 1 });

export const REFERRAL_TIERS: ReferralTier[] = [
    { name: 'Bronze Referrer', required_referrals: 5, bonus_reward: 1000 },
    { name: 'Silver Referrer', required_referrals: 10, bonus_reward: 2500 },
    { name: 'Gold Referrer', required_referrals: 25, bonus_reward: 7500 },
    { name: 'Platinum Referrer', required_referrals: 50, bonus_reward: 20000 }
];

export const Referral = mongoose.model<ReferralDocument>('Referral', ReferralSchema);