import mongoose, { Schema, Document } from 'mongoose';
import { PublisherPlatform } from '../types/pressRelease.types';

// Marketplace enums
export enum PublisherLevel {
  PREMIUM = 'Premium',
  HOT = 'Hot',
  FRESH = 'Fresh'
}

export enum EngagementLevel {
  HIGH_CTR = 'High CTR (5%+)',
  MEDIUM_CTR = 'Medium CTR (2-5%)',
  LOW_CTR = 'Low CTR (<2%)',
  PREMIUM_CTR = 'Premium CTR (8%+)'
}

export enum DeliveryTime {
  SAME_DAY = 'Same Day',
  NEXT_DAY = '1-2 Days',
  WEEK = '3-7 Days',
  TWO_WEEKS = '1-2 Weeks',
  MONTH = '2-4 Weeks'
}

export enum FormatType {
  ANALYSIS = 'Analysis',
  GUIDES = 'Guides', 
  NEWS = 'News',
  INTERVIEWS = 'Interviews',
  REVIEWS = 'Reviews',
  CASE_STUDIES = 'Case Studies',
  OPINION = 'Opinion',
  BREAKING_NEWS = 'Breaking News'
}

// Add-on and marketplace interfaces
export interface PublisherAddon {
  backdating?: {
    enabled: boolean;
    price?: number;
  };
  socialPosting?: {
    enabled: boolean;
    price?: number;
  };
  featuredPlacement?: {
    enabled: boolean;
    pricePerUnit?: number;
    maxQuantity?: number;
  };
  newsletterInclusion?: {
    enabled: boolean;
    price?: number;
  };
  authorByline?: {
    enabled: boolean;
    price?: number;
  };
  paidAmplification?: {
    enabled: boolean;
    minBudget?: number;
    maxBudget?: number;
  };
  whitePaperGating?: {
    enabled: boolean;
    price?: number;
    leadGenEnabled?: boolean;
  };
}

export interface PublisherReview {
  reviewerId: mongoose.Types.ObjectId;
  reviewerName: string;
  rating: number; // 1-5
  reviewText: string;
  timestamp: Date;
  isModerated: boolean;
  isApproved: boolean;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
}

export interface PublisherFAQ {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

interface PublisherDocument extends Document, Omit<PublisherPlatform, 'id'> {
    publisherId: string;  // We'll rename 'id' to 'publisherId' to avoid conflicts
    
    // Marketplace fields
    logo?: string;
    description?: string;
    level?: PublisherLevel;
    engagement?: EngagementLevel;
    delivery?: DeliveryTime;
    coverage?: string;
    formatDepth?: FormatType[];
    
    // Add-ons
    addOns?: PublisherAddon;
    
    // Enhanced metrics
    enhancedMetrics?: {
        ctrPercentage?: number;
        bounceRatePercentage?: number;
        referralTraffic?: number;
        buzzIndex?: number;
        vibeValuePercentage?: number;
        avgBacklinks?: {
            min: number;
            max: number;
        };
        lastUpdated?: Date;
    };
    
    // Reviews and ratings
    reviews?: PublisherReview[];
    averageRating?: number;
    totalReviews?: number;
    
    // FAQ
    faqs?: PublisherFAQ[];
    
    // Marketplace status
    isPublished?: boolean;
    isMarketplaceListing?: boolean;
    publicSlug?: string;
    
    // SEO fields
    metaTitle?: string;
    metaDescription?: string;
    socialImage?: string;
    
    // Analytics
    viewCount?: number;
    cartAddCount?: number;
    bookmarkCount?: number;
    shareCount?: number;
    conversionRate?: number;
    
    // Admin tracking
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    publishedAt?: Date;
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
    },
    
    // Marketplace fields
    logo: {
        type: String,
        validate: {
            validator: function(v: string) {
                return !v || /\.(jpg|jpeg|png|webp)$/i.test(v);
            },
            message: 'Logo must be a valid image format (JPG, PNG, WebP)'
        }
    },
    description: {
        type: String,
        maxlength: 200,
        trim: true
    },
    level: {
        type: String,
        enum: Object.values(PublisherLevel)
    },
    engagement: {
        type: String,
        enum: Object.values(EngagementLevel)
    },
    delivery: {
        type: String,
        enum: Object.values(DeliveryTime)
    },
    coverage: {
        type: String,
        maxlength: 500,
        trim: true
    },
    formatDepth: [{
        type: String,
        enum: Object.values(FormatType)
    }],
    
    // Add-ons configuration
    addOns: {
        backdating: {
            enabled: { type: Boolean, default: false },
            price: { type: Number, min: 0 }
        },
        socialPosting: {
            enabled: { type: Boolean, default: false },
            price: { type: Number, min: 0 }
        },
        featuredPlacement: {
            enabled: { type: Boolean, default: false },
            pricePerUnit: { type: Number, min: 0 },
            maxQuantity: { type: Number, min: 1, max: 10 }
        },
        newsletterInclusion: {
            enabled: { type: Boolean, default: false },
            price: { type: Number, min: 0 }
        },
        authorByline: {
            enabled: { type: Boolean, default: false },
            price: { type: Number, min: 0 }
        },
        paidAmplification: {
            enabled: { type: Boolean, default: false },
            minBudget: { type: Number, min: 0 },
            maxBudget: { type: Number, min: 0 }
        },
        whitePaperGating: {
            enabled: { type: Boolean, default: false },
            price: { type: Number, min: 0 },
            leadGenEnabled: { type: Boolean, default: false }
        }
    },
    
    // Enhanced metrics for marketplace
    enhancedMetrics: {
        ctrPercentage: { type: Number, min: 0, max: 100 },
        bounceRatePercentage: { type: Number, min: 0, max: 100 },
        referralTraffic: { type: Number, min: 0 },
        buzzIndex: { type: Number, min: 0 },
        vibeValuePercentage: { type: Number, min: 0, max: 100 },
        avgBacklinks: {
            min: { type: Number, min: 0 },
            max: { type: Number, min: 0 }
        },
        lastUpdated: { type: Date, default: Date.now }
    },
    
    // Reviews system
    reviews: [{
        reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reviewerName: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        reviewText: { type: String, required: true, maxlength: 1000 },
        timestamp: { type: Date, default: Date.now },
        isModerated: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
        moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        moderatedAt: { type: Date }
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    
    // FAQ system
    faqs: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        order: { type: Number, required: true },
        isActive: { type: Boolean, default: true }
    }],
    
    // Marketplace status
    isPublished: { type: Boolean, default: false },
    isMarketplaceListing: { type: Boolean, default: false },
    publicSlug: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    
    // SEO fields
    metaTitle: { type: String, maxlength: 60 },
    metaDescription: { type: String, maxlength: 160 },
    socialImage: { type: String },
    
    // Analytics
    viewCount: { type: Number, default: 0, min: 0 },
    cartAddCount: { type: Number, default: 0, min: 0 },
    bookmarkCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    
    // Admin tracking
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date }
}, {
    timestamps: true
});

// Indexes for efficient queries
PublisherSchema.index({ industry_focus: 1 });
PublisherSchema.index({ region_reach: 1 });
PublisherSchema.index({ name: 'text' });

// Marketplace indexes
PublisherSchema.index({ publicSlug: 1 }, { unique: true, sparse: true });
PublisherSchema.index({ isPublished: 1, isMarketplaceListing: 1 });
PublisherSchema.index({ level: 1 });
PublisherSchema.index({ averageRating: -1 });
PublisherSchema.index({ 'reviews.isApproved': 1 });
PublisherSchema.index({ createdAt: -1 });

// Text search index for marketplace
PublisherSchema.index({
  name: 'text',
  description: 'text',
  coverage: 'text'
});

// Pre-save middleware to generate slug
PublisherSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.publicSlug && this.isMarketplaceListing) {
    this.publicSlug = this.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  next();
});

// Pre-save middleware to update review stats
PublisherSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    const approvedReviews = (this.reviews || []).filter(r => r.isApproved);
    this.totalReviews = approvedReviews.length;
    
    if (approvedReviews.length > 0) {
      const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
      this.averageRating = Math.round((sum / approvedReviews.length) * 10) / 10;
    } else {
      this.averageRating = 0;
    }
  }
  next();
});

// Virtual for public URL
PublisherSchema.virtual('publicUrl').get(function() {
  return `/publishers/${this.publicSlug}`;
});

// Method to check if add-on should be displayed
PublisherSchema.methods.shouldDisplayAddon = function(addonName: string): boolean {
  if (!this.addOns || !this.addOns[addonName]) return false;
  
  const addon = this.addOns[addonName];
  return addon.enabled === true || 
         (typeof addon === 'object' && 'price' in addon && (addon.price || 0) > 0);
};

export const Publisher = mongoose.model<PublisherDocument>('Publisher', PublisherSchema);