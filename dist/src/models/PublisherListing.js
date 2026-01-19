"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherListing = exports.FormatType = exports.DeliveryTime = exports.EngagementLevel = exports.PublisherLevel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Enums for dropdown values
var PublisherLevel;
(function (PublisherLevel) {
    PublisherLevel["PREMIUM"] = "Premium";
    PublisherLevel["HOT"] = "Hot";
    PublisherLevel["FRESH"] = "Fresh";
})(PublisherLevel || (exports.PublisherLevel = PublisherLevel = {}));
var EngagementLevel;
(function (EngagementLevel) {
    EngagementLevel["HIGH_CTR"] = "High CTR (5%+)";
    EngagementLevel["MEDIUM_CTR"] = "Medium CTR (2-5%)";
    EngagementLevel["LOW_CTR"] = "Low CTR (<2%)";
    EngagementLevel["PREMIUM_CTR"] = "Premium CTR (8%+)";
})(EngagementLevel || (exports.EngagementLevel = EngagementLevel = {}));
var DeliveryTime;
(function (DeliveryTime) {
    DeliveryTime["SAME_DAY"] = "Same Day";
    DeliveryTime["NEXT_DAY"] = "1-2 Days";
    DeliveryTime["WEEK"] = "3-7 Days";
    DeliveryTime["TWO_WEEKS"] = "1-2 Weeks";
    DeliveryTime["MONTH"] = "2-4 Weeks";
})(DeliveryTime || (exports.DeliveryTime = DeliveryTime = {}));
var FormatType;
(function (FormatType) {
    FormatType["ANALYSIS"] = "Analysis";
    FormatType["GUIDES"] = "Guides";
    FormatType["NEWS"] = "News";
    FormatType["INTERVIEWS"] = "Interviews";
    FormatType["REVIEWS"] = "Reviews";
    FormatType["CASE_STUDIES"] = "Case Studies";
    FormatType["OPINION"] = "Opinion";
    FormatType["BREAKING_NEWS"] = "Breaking News";
})(FormatType || (exports.FormatType = FormatType = {}));
const PublisherListingSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
            reviewerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            reviewerName: { type: String, required: true },
            rating: { type: Number, min: 1, max: 5, required: true },
            reviewText: { type: String, required: true, maxlength: 1000 },
            timestamp: { type: Date, default: Date.now },
            isModerated: { type: Boolean, default: false },
            isApproved: { type: Boolean, default: false },
            moderatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
PublisherListingSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.publicSlug) {
        this.publicSlug = this.title.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') + '-' + Date.now();
    }
    next();
});
// Pre-save middleware to update review stats
PublisherListingSchema.pre('save', function (next) {
    if (this.isModified('reviews')) {
        const approvedReviews = this.reviews.filter(r => r.isApproved);
        this.totalReviews = approvedReviews.length;
        if (approvedReviews.length > 0) {
            const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
            this.averageRating = Math.round((sum / approvedReviews.length) * 10) / 10;
        }
        else {
            this.averageRating = 0;
        }
    }
    next();
});
// Virtual for public URL
PublisherListingSchema.virtual('publicUrl').get(function () {
    return `/publishers/${this.publicSlug}`;
});
// Method to check if add-on should be displayed
PublisherListingSchema.methods.shouldDisplayAddon = function (addonName) {
    const addon = this.addOns[addonName];
    if (!addon)
        return false;
    return addon.enabled === true ||
        (typeof addon === 'object' && 'price' in addon && (addon.price || 0) > 0);
};
exports.PublisherListing = mongoose_1.default.model('PublisherListing', PublisherListingSchema);
