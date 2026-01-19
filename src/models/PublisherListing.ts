import mongoose, { Schema, Document } from 'mongoose';

// Enums for dropdown values
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

// Add-on interfaces
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

// Metrics interface
export interface PublisherMetrics {
  domainAuthority: number; // xx / 100
  trustScore: number; // xx / 100
  avgTrafficMonthly: number; // Number / month
  avgBacklinks: {
    min: number;
    max: number;
  };
  ctrPercentage: number; // CTR %
  bounceRatePercentage: number; // Bounce Rate %
  referralTraffic: number; // Number
  buzzIndex: number; // Score
  vibeValuePercentage: number; // %
  lastUpdated?: Date;
}

// FAQ interface
export interface PublisherFAQ {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

// Review interface
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

// Main Publisher Listing interface
export interface IPublisherListing extends Document {
  // Global Header Fields
  title: string; // Max 50 chars
  logo?: string; // Image URL
  description: string; // Max 200 chars
  basePrice: number; // Amount
  pricingUnit: string; // e.g., "per placement", "per article"
  
  // Core Publisher Attributes
  level: PublisherLevel;
  engagement: EngagementLevel;
  delivery: DeliveryTime;
  coverage: string; // Max 500 chars
  industryFocus: string; // Max 500 chars
  audienceReach: string; // Max 500 chars
  formatDepth: FormatType[];
  
  // Add-ons Configuration
  addOns: PublisherAddon;
  
  // Metrics
  metrics: PublisherMetrics;
  
  // Reviews
  reviews: PublisherReview[];
  averageRating: number;
  totalReviews: number;
  
  // FAQ
  faqs: PublisherFAQ[];
  
  // Status and Meta
  isPublished: boolean;
  isActive: boolean;
  publicSlug: string; // For public profile page
  
  // SEO and Social
  metaTitle?: string;
  metaDescription?: string;
  socialImage?: string;
  
  // Admin tracking
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  
  // Analytics
  viewCount: number;
  cartAddCount: number;
  bookmarkCount: number;
  shareCount: number;
  conversionRate: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PublisherListingSchema = new Schema<IPublisherListing>({
  // Global Header Fields
  title: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
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
    required: true,
    maxlength: 200,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricingUnit: {
    type: String,
    required: true,
    default: 'per placement'
  },

  // Core Publisher Attributes
  level: {
    type: String,
    enum: Object.values(PublisherLevel),
    required: true
  },
  engagement: {
    type: String,
    enum: Object.values(EngagementLevel),
    required: true
  },
  delivery: {
    type: String,
    enum: Object.values(DeliveryTime),
    required: true
  },
  coverage: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  industryFocus: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  audienceReach: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  formatDepth: [{
    type: String,
    enum: Object.values(FormatType)
  }],

  // Add-ons Configuration
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

  // Metrics
  metrics: {
    domainAuthority: { type: Number, min: 0, max: 100, required: true },
    trustScore: { type: Number, min: 0, max: 100, required: true },
    avgTrafficMonthly: { type: Number, min: 0, required: true },
    avgBacklinks: {
      min: { type: Number, min: 0, required: true },
      max: { type: Number, min: 0, required: true }
    },
    ctrPercentage: { type: Number, min: 0, max: 100, required: true },
    bounceRatePercentage: { type: Number, min: 0, max: 100, required: true },
    referralTraffic: { type: Number, min: 0, required: true },
    buzzIndex: { type: Number, min: 0, required: true },
    vibeValuePercentage: { type: Number, min: 0, max: 100, required: true },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Reviews
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

  // FAQ
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  }],

  // Status and Meta
  isPublished: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  publicSlug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },

  // SEO and Social
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  socialImage: { type: String },

  // Admin tracking
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },

  // Analytics
  viewCount: { type: Number, default: 0, min: 0 },
  cartAddCount: { type: Number, default: 0, min: 0 },
  bookmarkCount: { type: Number, default: 0, min: 0 },
  shareCount: { type: Number, default: 0, min: 0 },
  conversionRate: { type: Number, default: 0, min: 0, max: 100 }
}, {
  timestamps: true
});

// Indexes for performance
PublisherListingSchema.index({ publicSlug: 1 }, { unique: true });
PublisherListingSchema.index({ isPublished: 1, isActive: 1 });
PublisherListingSchema.index({ level: 1 });
PublisherListingSchema.index({ industryFocus: 1 });
PublisherListingSchema.index({ averageRating: -1 });
PublisherListingSchema.index({ basePrice: 1 });
PublisherListingSchema.index({ createdAt: -1 });
PublisherListingSchema.index({ 'reviews.isApproved': 1 });

// Text search index
PublisherListingSchema.index({
  title: 'text',
  description: 'text',
  industryFocus: 'text',
  coverage: 'text'
});

// Pre-save middleware to generate slug
PublisherListingSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.publicSlug) {
    this.publicSlug = this.title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  next();
});

// Pre-save middleware to update review stats
PublisherListingSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    const approvedReviews = this.reviews.filter(r => r.isApproved);
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
PublisherListingSchema.virtual('publicUrl').get(function() {
  return `/publishers/${this.publicSlug}`;
});

// Method to check if add-on should be displayed
PublisherListingSchema.methods.shouldDisplayAddon = function(addonName: keyof PublisherAddon): boolean {
  const addon = this.addOns[addonName];
  if (!addon) return false;
  
  return addon.enabled === true || 
         (typeof addon === 'object' && 'price' in addon && (addon.price || 0) > 0);
};

export const PublisherListing = mongoose.model<IPublisherListing>('PublisherListing', PublisherListingSchema);