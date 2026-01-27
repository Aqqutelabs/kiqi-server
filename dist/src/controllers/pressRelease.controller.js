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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPressReleasesWithProgress = exports.rejectPressRelease = exports.approvePressRelease = exports.updatePressReleaseToUnderReview = exports.getPressReleaseProgress = exports.getPressReleasesWithTracker = exports.updatePressReleaseTrackerStatus = exports.getPressReleaseTracker = exports.paystackWebhook = exports.verifyPayment = exports.getOrderDetails = exports.sharePublisher = exports.getUserBookmarks = exports.removeBookmark = exports.addBookmark = exports.addToCartWithAddons = exports.getMarketplaceFilters = exports.submitPublisherReview = exports.removeFromCart = exports.updateCartItem = exports.createPublisher = exports.createOrder = exports.getCart = exports.addToCart = exports.getPublisherDetails = exports.getPublishers = exports.deletePressRelease = exports.updatePressRelease = exports.createPressRelease = exports.getPressReleaseDetails = exports.getPressReleaseStats = exports.getDashboardMetrics = exports.getPressReleasesList = exports.getProgressTimeline = exports.recordProgressStep = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const PressRelease_1 = require("../models/PressRelease");
const PressReleaseProgress_1 = require("../models/PressReleaseProgress");
const Publisher_1 = require("../models/Publisher");
const Order_1 = require("../models/Order");
const Cart_1 = require("../models/Cart");
const paystack_1 = require("../utils/paystack");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("cloudinary");
const crypto_1 = require("crypto");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: 'dphdvbdwg',
    api_key: '164375779418948',
    api_secret: 'otQq6cFFzqGeQO4umSVrrFumA30' // Replace with your actual API secret
});
// Helper function to transform add-ons into user-friendly format
const transformAddOns = (addOns) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const transformed = [];
    if (!addOns)
        return transformed;
    // Backdating
    if (((_a = addOns.backdating) === null || _a === void 0 ? void 0 : _a.enabled) && addOns.backdating.price) {
        transformed.push({
            id: 'backdating',
            name: 'Backdating',
            price: addOns.backdating.price,
            description: 'Publish your press release with a custom backdated timestamp for better SEO and visibility.'
        });
    }
    // Social Posting
    if (((_b = addOns.socialPosting) === null || _b === void 0 ? void 0 : _b.enabled) && addOns.socialPosting.price) {
        transformed.push({
            id: 'socialPosting',
            name: 'Social Media Posting',
            price: addOns.socialPosting.price,
            description: 'Additional promotion across the publisher\'s social media channels for increased reach.'
        });
    }
    // Featured Placement
    if (((_c = addOns.featuredPlacement) === null || _c === void 0 ? void 0 : _c.enabled) && addOns.featuredPlacement.pricePerUnit) {
        transformed.push({
            id: 'featuredPlacement',
            name: 'Featured Placement',
            price: addOns.featuredPlacement.pricePerUnit,
            quantity: addOns.featuredPlacement.maxQuantity || 1,
            description: 'Premium positioning on the publisher\'s website for maximum visibility and engagement.'
        });
    }
    // Newsletter Inclusion
    if (((_d = addOns.newsletterInclusion) === null || _d === void 0 ? void 0 : _d.enabled) && addOns.newsletterInclusion.price) {
        transformed.push({
            id: 'newsletterInclusion',
            name: 'Newsletter Inclusion',
            price: addOns.newsletterInclusion.price,
            description: 'Include your press release in the publisher\'s email newsletter distribution.'
        });
    }
    // Author Byline
    if (((_e = addOns.authorByline) === null || _e === void 0 ? void 0 : _e.enabled) && addOns.authorByline.price) {
        transformed.push({
            id: 'authorByline',
            name: 'Custom Author Byline',
            price: addOns.authorByline.price,
            description: 'Add a custom author name or company attribution to your press release.'
        });
    }
    // Paid Amplification
    if ((_f = addOns.paidAmplification) === null || _f === void 0 ? void 0 : _f.enabled) {
        transformed.push({
            id: 'paidAmplification',
            name: 'Paid Amplification',
            price: addOns.paidAmplification.minBudget || 0,
            description: `Budget-based advertising boost ($${addOns.paidAmplification.minBudget || 0} - $${addOns.paidAmplification.maxBudget || 10000}).`
        });
    }
    // White Paper Gating
    if (((_g = addOns.whitePaperGating) === null || _g === void 0 ? void 0 : _g.enabled) && addOns.whitePaperGating.price) {
        transformed.push({
            id: 'whitePaperGating',
            name: 'White Paper Gating',
            price: addOns.whitePaperGating.price,
            description: 'Gate your press release behind a lead generation form to capture valuable contacts.'
        });
    }
    return transformed;
};
/**
 * Helper function to record a progress step for a press release
 * This creates/updates the tracking record in the database
 */
const recordProgressStep = (prId, userId, step, notes, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`📍 Recording progress step: ${step} for PR: ${prId}, User: ${userId}`);
        let progress = yield PressReleaseProgress_1.PressReleaseProgress.findOne({
            press_release_id: prId,
            user_id: userId
        });
        if (!progress) {
            console.log(`📝 Creating new progress record for PR: ${prId}`);
            // Create new progress record
            progress = new PressReleaseProgress_1.PressReleaseProgress({
                press_release_id: prId,
                user_id: userId,
                current_step: step,
                progress_history: [{
                        step,
                        timestamp: new Date(),
                        notes,
                        metadata
                    }]
            });
        }
        else {
            console.log(`🔄 Updating existing progress record for PR: ${prId}`);
            // Update existing progress record
            progress.current_step = step;
            progress.progress_history.push({
                step,
                timestamp: new Date(),
                notes,
                metadata
            });
        }
        // Update status-specific fields
        switch (step) {
            case 'initiated':
                progress.initiated_at = new Date();
                break;
            case 'payment_completed':
                progress.payment_completed_at = new Date();
                break;
            case 'under_review':
                progress.under_review_at = new Date();
                break;
            case 'approved':
                progress.completed_at = new Date();
                break;
            case 'rejected':
                progress.rejected_at = new Date();
                progress.rejection_reason = (metadata === null || metadata === void 0 ? void 0 : metadata.rejection_reason) || 'No reason provided';
                break;
        }
        progress.updated_at = new Date();
        yield progress.save();
        // Also update the PressRelease tracker field for backward compatibility
        try {
            const pressRelease = yield PressRelease_1.PressRelease.findById(prId);
            if (pressRelease) {
                // Map ProgressStep to PressReleaseTrackerStatus
                const statusMapping = {
                    'initiated': 'pending',
                    'payment_pending': 'pending',
                    'payment_completed': 'processing',
                    'under_review': 'review',
                    'approved': 'completed',
                    'rejected': 'rejected'
                };
                // Map to progress percentage
                const progressMapping = {
                    'initiated': 0,
                    'payment_pending': 20,
                    'payment_completed': 40,
                    'under_review': 60,
                    'approved': 100,
                    'rejected': 100
                };
                const trackerStatus = statusMapping[step];
                const progressPercentage = progressMapping[step];
                // Initialize tracker if it doesn't exist
                if (!pressRelease.tracker) {
                    pressRelease.tracker = {
                        current_status: 'pending',
                        status_history: [],
                        progress_percentage: 0,
                        estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        reviewers_count: 0
                    };
                }
                // Update tracker
                pressRelease.tracker.current_status = trackerStatus;
                pressRelease.tracker.progress_percentage = progressPercentage;
                pressRelease.tracker.status_history.push({
                    status: trackerStatus,
                    timestamp: new Date(),
                    notes: notes || `Status updated to ${trackerStatus}`
                });
                // Set actual completion for completed/rejected
                if (step === 'approved' || step === 'rejected') {
                    pressRelease.tracker.actual_completion = new Date();
                }
                yield pressRelease.save();
                console.log(`✅ PressRelease tracker updated for PR: ${prId}`);
            }
        }
        catch (trackerError) {
            console.error('❌ Error updating PressRelease tracker:', trackerError);
            // Don't throw - progress was saved successfully
        }
        console.log(`✅ Progress step recorded successfully: ${step} for PR: ${prId}`);
        return progress;
    }
    catch (error) {
        console.error('❌ Error recording progress step:', error);
        throw error;
    }
});
exports.recordProgressStep = recordProgressStep;
/**
 * Helper function to get the full progress timeline for a press release
 */
const getProgressTimeline = (prId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🔍 Searching for progress timeline: PR=${prId}, User=${userId}`);
        const progress = yield PressReleaseProgress_1.PressReleaseProgress.findOne({
            press_release_id: prId,
            user_id: userId
        });
        if (!progress) {
            console.warn(`⚠️  Progress record NOT found for PR: ${prId}, User: ${userId}`);
            return null;
        }
        console.log(`✅ Progress record found for PR: ${prId}, Current step: ${progress.current_step}`);
        return {
            press_release_id: progress.press_release_id,
            current_step: progress.current_step,
            initiated_at: progress.initiated_at,
            payment_completed_at: progress.payment_completed_at,
            under_review_at: progress.under_review_at,
            completed_at: progress.completed_at,
            rejected_at: progress.rejected_at,
            rejection_reason: progress.rejection_reason,
            progress_history: progress.progress_history.map(record => ({
                step: record.step,
                timestamp: record.timestamp,
                notes: record.notes,
                metadata: record.metadata
            }))
        };
    }
    catch (error) {
        console.error('❌ Error getting progress timeline:', error);
        throw error;
    }
});
exports.getProgressTimeline = getProgressTimeline;
exports.getPressReleasesList = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .select('_id title status distribution campaign performance_views date_created');
    const pr_list = pressReleases.map(pr => ({
        _id: pr._id,
        title: pr.title,
        status: pr.status,
        distribution: pr.distribution,
        campaign: pr.campaign,
        performance_views: pr.performance_views,
        date_created: pr.date_created
    }));
    return res.json(new ApiResponse_1.ApiResponse(200, pr_list));
}));
exports.getDashboardMetrics = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId });
    const orders = yield Order_1.Order.find({ user_id: userId });
    const total_press_releases = pressReleases.length;
    const total_views = pressReleases.reduce((acc, pr) => acc + pr.metrics.total_views, 0);
    const total_spent = orders.reduce((acc, order) => {
        const amount = parseFloat(order.order_summary.total_amount.replace(/[^0-9.-]+/g, ''));
        return acc + amount;
    }, 0);
    const total_channels = new Set(pressReleases.flatMap(pr => pr.distribution_report.map(dr => dr.outlet_name))).size;
    const pr_list = pressReleases.map(pr => ({
        title: pr.title,
        status: pr.status,
        distribution: pr.distribution,
        campaign: pr.campaign,
        performance_views: pr.performance_views,
        date_created: pr.date_created
    }));
    return res.json(new ApiResponse_1.ApiResponse(200, {
        total_press_releases,
        total_views: `${(total_views / 1000).toFixed(1)}K`,
        total_spent: `₦${total_spent.toLocaleString()}`,
        total_channels,
        pr_list
    }));
}));
exports.getPressReleaseStats = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId });
    const orders = yield Order_1.Order.find({ user_id: userId });
    const press_releases_count = pressReleases.length;
    const press_release_views = pressReleases.reduce((acc, pr) => acc + pr.metrics.total_views, 0);
    const total_amount_spent = orders.reduce((acc, order) => {
        const amount = parseFloat(order.order_summary.total_amount.replace(/[^0-9.-]+/g, ''));
        return acc + amount;
    }, 0);
    const media_channels = new Set(pressReleases.flatMap(pr => pr.distribution_report.map(dr => dr.outlet_name))).size;
    return res.json(new ApiResponse_1.ApiResponse(200, {
        press_releases: {
            count: press_releases_count,
            change: 0,
            trend: 0
        },
        press_release_views: {
            count: press_release_views,
            change: 0,
            trend: 0
        },
        total_amount_spent: {
            amount: `$${(total_amount_spent / 550).toFixed(2)}`, // Convert to USD (assuming 550 NGN = 1 USD approximately)
            change: 0,
            trend: 0
        },
        media_channels: {
            count: media_channels
        }
    }));
}));
exports.getPressReleaseDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pressRelease = yield PressRelease_1.PressRelease.findById(req.params.id);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    if (!pressRelease.title) {
        console.warn(`Press release with ID ${req.params.id} is missing the title field.`);
    }
    // Ensure response includes all fields including title
    const responseData = Object.assign(Object.assign({}, pressRelease.toObject()), { title: pressRelease.title });
    return res.json(new ApiResponse_1.ApiResponse(200, responseData));
}));
exports.createPressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Request body:', req.body);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { campaign, pr_content, status, title, distribution, performance_views } = req.body;
    // Validate title
    if (!title) {
        throw new ApiError_1.ApiError(400, 'Title is required');
    }
    let imageUrl = '';
    // Handle image upload to Cloudinary
    if (req.file) {
        try {
            const uploadResult = yield cloudinary_1.v2.uploader.upload(req.file.path, {
                folder: 'press_releases',
                public_id: `${userId}_${Date.now()}`
            });
            imageUrl = uploadResult.secure_url;
        }
        catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new ApiError_1.ApiError(500, 'Failed to upload image');
        }
    }
    const pressRelease = yield PressRelease_1.PressRelease.create({
        campaign: campaign || title || '', // prefer explicit campaign, fallback to title
        title: title || '',
        content: pr_content,
        status,
        distribution: distribution || '',
        performance_views: performance_views || '0',
        image: imageUrl, // Store the Cloudinary image URL
        user_id: userId, // userId is already checked above
        date_created: new Date().toISOString(),
        metrics: {
            total_views: 0,
            total_clicks: 0,
            engagement_rate: '0%',
            avg_time_on_page: '0:00'
        }
    });
    console.log(`✅ PR created successfully: ${pressRelease._id}`);
    // Record the initial progress step
    try {
        yield (0, exports.recordProgressStep)(pressRelease._id, userId, 'initiated', `Press release "${title}" initiated`, { title, status });
        console.log(`✅ Progress step recorded for PR: ${pressRelease._id}`);
    }
    catch (progressError) {
        console.error(`❌ Failed to record progress step for PR: ${pressRelease._id}`, progressError);
        // Don't throw - PR was created successfully, just log the error
    }
    return res.json(new ApiResponse_1.ApiResponse(201, pressRelease));
}));
exports.updatePressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, pressRelease));
}));
exports.deletePressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndDelete(req.params.id);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Press release deleted successfully' }));
}));
exports.getPublishers = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { level, engagement, delivery, industry, region, minRating, maxPrice, minPrice, sortBy = 'averageRating', sortOrder = 'desc', page = 1, limit = 20, searchTerm } = req.query;
    // Build filter for published marketplace listings only
    const filter = {
        isPublished: true,
        isMarketplaceListing: true
    };
    // Apply marketplace filters
    if (level)
        filter.level = level;
    if (engagement)
        filter.engagement = engagement;
    if (delivery)
        filter.delivery = delivery;
    if (industry)
        filter.industry_focus = { $in: [industry] };
    if (region)
        filter.region_reach = { $in: [region] };
    if (minRating)
        filter.averageRating = { $gte: parseFloat(minRating) };
    // Price filtering (convert string price to number)
    if (minPrice || maxPrice) {
        filter.$expr = {};
        const priceConditions = [];
        if (minPrice) {
            priceConditions.push({
                $gte: [{ $toDouble: { $replaceAll: { input: '$price', find: /[^0-9.]/g, replacement: '' } } }, parseFloat(minPrice)]
            });
        }
        if (maxPrice) {
            priceConditions.push({
                $lte: [{ $toDouble: { $replaceAll: { input: '$price', find: /[^0-9.]/g, replacement: '' } } }, parseFloat(maxPrice)]
            });
        }
        if (priceConditions.length === 1) {
            filter.$expr = priceConditions[0];
        }
        else if (priceConditions.length === 2) {
            filter.$expr = { $and: priceConditions };
        }
    }
    // Search functionality
    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { coverage: { $regex: searchTerm, $options: 'i' } },
            { industry_focus: { $in: [new RegExp(searchTerm, 'i')] } }
        ];
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const skip = (pageNum - 1) * limitNum;
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    // Add secondary sort by average rating for relevance
    if (sortBy !== 'averageRating') {
        sort.averageRating = -1;
    }
    const publishers = yield Publisher_1.Publisher.find(filter)
        .select('-reviews -__v') // Exclude full reviews array for performance
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();
    // Increment view count for each publisher (async, don't wait)
    const publisherIds = publishers.map(p => p._id);
    Publisher_1.Publisher.updateMany({ _id: { $in: publisherIds } }, { $inc: { viewCount: 1 } }).exec().catch(err => console.error('Error updating view counts:', err));
    const total = yield Publisher_1.Publisher.countDocuments(filter);
    // Transform publishers for marketplace display
    const marketplacePublishers = publishers.map(publisher => ({
        id: publisher._id,
        publisherId: publisher.publisherId,
        name: publisher.name,
        logo: publisher.logo,
        description: publisher.description,
        price: publisher.price,
        level: publisher.level,
        engagement: publisher.engagement,
        delivery: publisher.delivery,
        coverage: publisher.coverage,
        industry_focus: publisher.industry_focus,
        region_reach: publisher.region_reach,
        audience_reach: publisher.audience_reach,
        formatDepth: publisher.formatDepth,
        averageRating: publisher.averageRating || 0,
        totalReviews: publisher.totalReviews || 0,
        metrics: Object.assign(Object.assign({}, publisher.metrics), publisher.enhancedMetrics),
        addOns: transformAddOns(publisher.addOns),
        publicSlug: publisher.publicSlug,
        hasAddOns: Object.values(publisher.addOns || {}).some((addon) => (addon === null || addon === void 0 ? void 0 : addon.enabled) === true || ((addon === null || addon === void 0 ? void 0 : addon.price) && addon.price > 0))
    }));
    return res.json(new ApiResponse_1.ApiResponse(200, {
        publishers: marketplacePublishers,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        },
        filters: {
            availableLevels: ['Premium', 'Hot', 'Fresh'],
            availableEngagements: ['High CTR (5%+)', 'Medium CTR (2-5%)', 'Low CTR (<2%)', 'Premium CTR (8%+)'],
            availableDeliveries: ['Same Day', '1-2 Days', '3-7 Days', '1-2 Weeks', '2-4 Weeks']
        }
    }));
}));
exports.getPublisherDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { id } = req.params;
    let publisher;
    // Support both MongoDB ID and publicSlug
    if (mongoose_1.default.Types.ObjectId.isValid(id)) {
        publisher = yield Publisher_1.Publisher.findById(id);
    }
    else {
        // Try to find by publicSlug
        publisher = yield Publisher_1.Publisher.findOne({ publicSlug: id, isPublished: true, isMarketplaceListing: true });
    }
    if (!publisher) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
    }
    // Increment view count (async, don't wait)
    Publisher_1.Publisher.findByIdAndUpdate(publisher._id, { $inc: { viewCount: 1 } }).exec().catch(err => console.error('Error updating view count:', err));
    // Prepare detailed publisher data for marketplace
    const publisherDetails = {
        id: publisher._id,
        publisherId: publisher.publisherId,
        name: publisher.name,
        logo: publisher.logo,
        description: publisher.description,
        price: publisher.price,
        level: publisher.level,
        engagement: publisher.engagement,
        delivery: publisher.delivery,
        coverage: publisher.coverage,
        industryFocus: publisher.industry_focus,
        audienceReach: publisher.audience_reach,
        formatDepth: publisher.formatDepth,
        // Metrics page data
        metrics: {
            domainAuthority: ((_a = publisher.metrics) === null || _a === void 0 ? void 0 : _a.domain_authority) || 0,
            trustScore: ((_b = publisher.metrics) === null || _b === void 0 ? void 0 : _b.trust_score) || 0,
            avgTrafficMonthly: ((_c = publisher.metrics) === null || _c === void 0 ? void 0 : _c.avg_traffic) || 0,
            avgBacklinks: ((_d = publisher.enhancedMetrics) === null || _d === void 0 ? void 0 : _d.avgBacklinks) || { min: 0, max: 0 },
            ctrPercentage: ((_e = publisher.enhancedMetrics) === null || _e === void 0 ? void 0 : _e.ctrPercentage) || 0,
            bounceRatePercentage: ((_f = publisher.enhancedMetrics) === null || _f === void 0 ? void 0 : _f.bounceRatePercentage) || 0,
            referralTraffic: ((_g = publisher.enhancedMetrics) === null || _g === void 0 ? void 0 : _g.referralTraffic) || 0,
            buzzIndex: ((_h = publisher.enhancedMetrics) === null || _h === void 0 ? void 0 : _h.buzzIndex) || 0,
            vibeValuePercentage: ((_j = publisher.enhancedMetrics) === null || _j === void 0 ? void 0 : _j.vibeValuePercentage) || 0
        },
        // Add-ons (transformed to user-friendly format)
        addOns: transformAddOns(publisher.addOns),
        // Reviews (only approved ones)
        reviews: {
            average: publisher.averageRating || 0,
            total: publisher.totalReviews || 0,
            list: (publisher.reviews || [])
                .filter(review => review.isApproved)
                .map(review => ({
                id: review._id,
                reviewerName: review.reviewerName,
                rating: review.rating,
                text: review.reviewText,
                timestamp: review.timestamp
            }))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10), // Latest 10 reviews
            // Star distribution
            distribution: [5, 4, 3, 2, 1].map(star => {
                const count = (publisher.reviews || [])
                    .filter(r => r.isApproved && r.rating === star).length;
                const totalReviewCount = publisher.totalReviews || 0;
                const percentage = totalReviewCount > 0 ?
                    Math.round((count / totalReviewCount) * 100) : 0;
                return { star, count, percentage };
            })
        },
        // FAQ (only active ones)
        faqs: (publisher.faqs || [])
            .filter(faq => faq.isActive)
            .sort((a, b) => a.order - b.order),
        // SEO data
        seo: {
            metaTitle: publisher.metaTitle || publisher.name,
            metaDescription: publisher.metaDescription || publisher.description,
            socialImage: publisher.socialImage || publisher.logo
        },
        // Public URL
        publicUrl: `/publishers/${publisher.publicSlug}`,
        publicSlug: publisher.publicSlug
    };
    return res.json(new ApiResponse_1.ApiResponse(200, publisherDetails));
}));
// Add to cart
exports.addToCart = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.body;
    // Find the publisher
    const publisher = yield Publisher_1.Publisher.findOne({ publisherId });
    if (!publisher) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
    }
    // Add or update cart item with all publisher details
    const cartItem = {
        publisherId: publisher.publisherId,
        name: publisher.name,
        price: publisher.price,
        region_reach: publisher.region_reach || [],
        audience_reach: publisher.audience_reach,
        selected: true
    };
    // Find existing cart or create new one
    let cart = yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, {
        $addToSet: { items: cartItem },
        updated_at: new Date()
    }, { upsert: true, new: true });
    return res.json(new ApiResponse_1.ApiResponse(200, cart));
}));
// Get cart items
exports.getCart = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const cart = yield Cart_1.Cart.findOne({ user_id: userId });
    let cartResponse;
    if (cart && cart.items.length > 0) {
        // Fetch publisher data for each item to get the latest region_reach and audience_reach
        const enrichedItems = yield Promise.all(cart.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const publisher = yield Publisher_1.Publisher.findOne({ publisherId: item.publisherId });
                if (!publisher) {
                    console.warn(`Publisher not found for publisherId: ${item.publisherId}`);
                }
                return {
                    publisherId: item.publisherId,
                    name: item.name,
                    price: item.price,
                    selected: item.selected,
                    region_reach: (publisher === null || publisher === void 0 ? void 0 : publisher.region_reach) || item.region_reach || [],
                    audience_reach: (publisher === null || publisher === void 0 ? void 0 : publisher.audience_reach) || item.audience_reach || 'N/A'
                };
            }
            catch (error) {
                console.error(`Error fetching publisher data for publisherId: ${item.publisherId}`, error);
                return {
                    publisherId: item.publisherId,
                    name: item.name,
                    price: item.price,
                    selected: item.selected,
                    region_reach: item.region_reach || [],
                    audience_reach: item.audience_reach || 'N/A'
                };
            }
        })));
        cartResponse = {
            _id: cart._id,
            user_id: cart.user_id,
            items: enrichedItems,
            audience: cart.audience || null,
            location: cart.location || null,
            created_at: cart.created_at,
            updated_at: cart.updated_at
        };
    }
    else {
        cartResponse = {
            items: [],
            audience: null,
            location: null
        };
    }
    return res.json(new ApiResponse_1.ApiResponse(200, cartResponse));
}));
exports.createOrder = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id || !req.user.email) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const userEmail = req.user.email;
    const { press_release_id } = req.body;
    // Get user's cart
    const cart = yield Cart_1.Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
        throw new ApiError_1.ApiError(400, 'Cart is empty');
    }
    // Calculate order summary
    const subtotal = cart.items.reduce((acc, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
        return acc + price;
    }, 0);
    const vat_percentage = '7.5%';
    const vat_amount = subtotal * 0.075;
    const total_amount = subtotal + vat_amount;
    // Generate unique reference for Paystack
    const reference = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    // Create the order with 'Pending' status
    const orderData = {
        user_id: userId,
        items: cart.items,
        order_summary: {
            subtotal: `₦${subtotal.toLocaleString()}`,
            vat_percentage,
            vat_amount: `₦${vat_amount.toLocaleString()}`,
            total_amount: `₦${total_amount.toLocaleString()}`
        },
        payment_method: 'Paystack',
        status: 'Pending',
        reference,
        created_at: new Date()
    };
    // Add press_release_id if provided
    if (press_release_id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(press_release_id)) {
            throw new ApiError_1.ApiError(400, 'Invalid press release ID');
        }
        orderData.press_release_id = press_release_id;
    }
    const order = yield Order_1.Order.create(orderData);
    // Record payment_pending step if press_release_id is provided
    if (press_release_id) {
        try {
            console.log(`📍 Recording payment_pending for PR: ${press_release_id}`);
            yield (0, exports.recordProgressStep)(press_release_id, userId, 'payment_pending', `Payment initiated for press release distribution`, { order_id: String(order._id), payment_reference: reference });
        }
        catch (progressError) {
            console.error(`❌ Failed to record payment_pending for PR: ${press_release_id}`, progressError);
            // Don't throw - order was created successfully
        }
    }
    // Initialize Paystack payment (cart will be cleared only after payment verification)
    const paystackResponse = yield (0, paystack_1.initializePaystackPayment)({
        amount: total_amount * 100, // Paystack expects amount in kobo
        email: userEmail,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/pr/payment/callback`
    });
    return res.json(new ApiResponse_1.ApiResponse(201, {
        order,
        payment: paystackResponse,
        message: 'Proceed to complete payment. Cart will be cleared after successful payment verification.'
    }));
}));
exports.createPublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    console.log('Create Publisher - Request Body:', req.body);
    const { name, description, website, turnaroundTime, industry_focus, region_reach, audienceReach, price, isPopular, isSelected, avg_publish_time, key_features, metrics } = req.body;
    const publisher = yield Publisher_1.Publisher.create({
        publisherId: `PUB${Date.now()}`, // Always generate unique ID, ignore any provided ID
        name,
        description,
        website,
        avg_publish_time: avg_publish_time || turnaroundTime,
        industry_focus: industry_focus || [],
        region_reach: region_reach || [],
        audience_reach: audienceReach,
        price,
        isPopular: isPopular || false,
        isSelected: isSelected || false,
        key_features: key_features || [],
        metrics: metrics || {
            domain_authority: 0,
            trust_score: 0,
            avg_traffic: 0,
            social_signals: 0
        },
        isPublished: true,
        isMarketplaceListing: true,
        created_by: userId,
        created_at: new Date().toISOString()
    });
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, publisher, 'Publisher created successfully'));
}));
// Update cart item (select/deselect)
exports.updateCartItem = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const { selected } = req.body;
    const cart = yield Cart_1.Cart.findOneAndUpdate({
        user_id: userId,
        'items.publisherId': publisherId
    }, {
        $set: {
            'items.$.selected': selected,
            updated_at: new Date()
        }
    }, { new: true });
    if (!cart) {
        throw new ApiError_1.ApiError(404, 'Cart item not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, cart));
}));
// Remove item from cart
exports.removeFromCart = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const cart = yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, {
        $pull: { items: { publisherId: publisherId } },
        updated_at: new Date()
    }, { new: true });
    if (!cart) {
        throw new ApiError_1.ApiError(404, 'Cart not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Item removed from cart', cart }));
}));
// Publisher review functionality
exports.submitPublisherReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const { rating, reviewText } = req.body;
    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError_1.ApiError(400, 'Rating must be between 1 and 5');
    }
    if (!reviewText || reviewText.trim().length < 10) {
        throw new ApiError_1.ApiError(400, 'Review text must be at least 10 characters');
    }
    if (reviewText.length > 1000) {
        throw new ApiError_1.ApiError(400, 'Review text cannot exceed 1000 characters');
    }
    const publisher = yield Publisher_1.Publisher.findById(publisherId);
    if (!publisher) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
    }
    // Check if user has already reviewed this publisher
    const existingReview = (_a = publisher.reviews) === null || _a === void 0 ? void 0 : _a.find(review => review.reviewerId.toString() === userId.toString());
    if (existingReview) {
        throw new ApiError_1.ApiError(400, 'You have already reviewed this publisher');
    }
    // TODO: Optionally check if user has actually purchased from this publisher
    // const hasOrder = await Order.findOne({ 
    //     user_id: userId, 
    //     'publications.publisherId': publisherId,
    //     payment_status: 'Successful'
    // });
    // if (!hasOrder) {
    //     throw new ApiError(403, 'You can only review publishers you have purchased from');
    // }
    // Create new review
    const newReview = {
        reviewerId: new mongoose_1.default.Types.ObjectId(userId),
        reviewerName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Anonymous',
        rating: parseInt(rating),
        reviewText: reviewText.trim(),
        timestamp: new Date(),
        isModerated: false,
        isApproved: false
    };
    // Add review to publisher
    publisher.reviews = publisher.reviews || [];
    publisher.reviews.push(newReview);
    yield publisher.save();
    return res.json(new ApiResponse_1.ApiResponse(201, {
        message: 'Review submitted successfully. It will be published after moderation.',
        review: {
            rating: newReview.rating,
            reviewText: newReview.reviewText,
            timestamp: newReview.timestamp
        }
    }));
}));
// Get marketplace filters and stats
exports.getMarketplaceFilters = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get unique filter values from published publishers
    const publishedPublishers = yield Publisher_1.Publisher.find({
        isPublished: true,
        isMarketplaceListing: true
    }).select('level engagement delivery industry_focus region_reach price');
    const filters = {
        levels: [...new Set(publishedPublishers.map(p => p.level).filter(Boolean))],
        engagements: [...new Set(publishedPublishers.map(p => p.engagement).filter(Boolean))],
        deliveries: [...new Set(publishedPublishers.map(p => p.delivery).filter(Boolean))],
        industries: [...new Set(publishedPublishers.flatMap(p => p.industry_focus || []))],
        regions: [...new Set(publishedPublishers.flatMap(p => p.region_reach || []))],
        priceRange: {
            min: Math.min(...publishedPublishers.map(p => parseFloat(p.price.replace(/[^0-9.-]+/g, '')) || 0)),
            max: Math.max(...publishedPublishers.map(p => parseFloat(p.price.replace(/[^0-9.-]+/g, '')) || 0))
        }
    };
    const stats = {
        totalPublishers: publishedPublishers.length,
        averageRating: yield Publisher_1.Publisher.aggregate([
            { $match: { isPublished: true, isMarketplaceListing: true } },
            { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
        ]).then(result => { var _a; return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0; }),
        totalReviews: yield Publisher_1.Publisher.aggregate([
            { $match: { isPublished: true, isMarketplaceListing: true } },
            { $group: { _id: null, totalReviews: { $sum: { $ifNull: ['$totalReviews', 0] } } } }
        ]).then(result => { var _a; return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.totalReviews) || 0; })
    };
    return res.json(new ApiResponse_1.ApiResponse(200, {
        filters,
        stats
    }));
}));
// Enhanced cart functionality for marketplace
exports.addToCartWithAddons = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId, selectedAddOns = [], quantity = 1, customBudgets = {} } = req.body;
    // Find the publisher
    const publisher = yield Publisher_1.Publisher.findById(publisherId);
    if (!publisher || !publisher.isPublished || !publisher.isMarketplaceListing) {
        throw new ApiError_1.ApiError(404, 'Publisher not found or not available');
    }
    // Calculate pricing
    const basePrice = parseFloat(publisher.price.replace(/[^0-9.-]+/g, ''));
    let addOnsPrice = 0;
    const processedAddOns = [];
    // Process selected add-ons
    for (const addonName of selectedAddOns) {
        const addon = (_a = publisher.addOns) === null || _a === void 0 ? void 0 : _a[addonName];
        if (addon && (addon.enabled || ('price' in addon && addon.price && addon.price > 0))) {
            let addonCost = ('price' in addon && addon.price) ? addon.price : 0;
            let addonQuantity = 1;
            // Handle different add-on types
            if (addonName === 'featuredPlacement' && 'pricePerUnit' in addon && addon.pricePerUnit) {
                const featuredAddon = addon;
                addonQuantity = Math.min(quantity, featuredAddon.maxQuantity || 1);
                addonCost = (featuredAddon.pricePerUnit || 0) * addonQuantity;
            }
            else if (addonName === 'paidAmplification' && customBudgets[addonName]) {
                const amplificationAddon = addon;
                const budget = parseFloat(customBudgets[addonName]);
                if (budget >= (amplificationAddon.minBudget || 0) && budget <= (amplificationAddon.maxBudget || 10000)) {
                    addonCost = budget;
                }
            }
            addOnsPrice += addonCost;
            processedAddOns.push({
                addonName,
                addonPrice: addonCost,
                quantity: addonQuantity,
                budget: addonName === 'paidAmplification' ? customBudgets[addonName] : undefined
            });
        }
    }
    const subtotal = (basePrice * quantity) + addOnsPrice;
    // Create cart item with enhanced structure
    const cartItem = {
        publisherId: publisher._id,
        publisherTitle: publisher.name,
        basePrice,
        quantity,
        selectedAddOns: processedAddOns,
        subtotal
    };
    // Find existing cart or create new one
    let cart = yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, {
        $pull: { items: { publisherId: publisher._id } }, // Remove existing item if any
        updated_at: new Date()
    }, { new: true, upsert: true });
    // Add new item
    const updatedCart = yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, {
        $push: { items: cartItem },
        updated_at: new Date()
    }, { new: true });
    if (!updatedCart) {
        throw new ApiError_1.ApiError(500, 'Failed to update cart');
    }
    cart = updatedCart;
    // Update publisher cart add count (async)
    Publisher_1.Publisher.findByIdAndUpdate(publisher._id, { $inc: { cartAddCount: 1 } }).exec().catch(err => console.error('Error updating cart count:', err));
    return res.json(new ApiResponse_1.ApiResponse(200, {
        cart,
        message: 'Item added to cart successfully',
        itemAdded: cartItem
    }));
}));
// Bookmark functionality
exports.addBookmark = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.body;
    const publisher = yield Publisher_1.Publisher.findById(publisherId);
    if (!publisher || !publisher.isPublished || !publisher.isMarketplaceListing) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
    }
    // Import Bookmark model
    const { Bookmark } = yield Promise.resolve().then(() => __importStar(require('../models/PublisherCart')));
    // Create or update bookmark
    const bookmark = yield Bookmark.findOneAndUpdate({ userId, publisherId }, { userId, publisherId }, { upsert: true, new: true });
    // Update publisher bookmark count (async)
    Publisher_1.Publisher.findByIdAndUpdate(publisherId, { $inc: { bookmarkCount: 1 } }).exec().catch(err => console.error('Error updating bookmark count:', err));
    return res.json(new ApiResponse_1.ApiResponse(200, { bookmark, message: 'Publisher bookmarked successfully' }));
}));
exports.removeBookmark = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const { Bookmark } = yield Promise.resolve().then(() => __importStar(require('../models/PublisherCart')));
    const bookmark = yield Bookmark.findOneAndDelete({ userId, publisherId });
    if (!bookmark) {
        throw new ApiError_1.ApiError(404, 'Bookmark not found');
    }
    // Update publisher bookmark count (async)
    Publisher_1.Publisher.findByIdAndUpdate(publisherId, { $inc: { bookmarkCount: -1 } }).exec().catch(err => console.error('Error updating bookmark count:', err));
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Bookmark removed successfully' }));
}));
exports.getUserBookmarks = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const skip = (pageNum - 1) * limitNum;
    const { Bookmark } = yield Promise.resolve().then(() => __importStar(require('../models/PublisherCart')));
    const bookmarks = yield Bookmark.find({ userId })
        .populate({
        path: 'publisherId',
        select: 'name logo description price level engagement delivery averageRating totalReviews publicSlug'
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    const total = yield Bookmark.countDocuments({ userId });
    // Ensure populated publisher data has default values
    const processedBookmarks = bookmarks.map(bookmark => {
        var _a, _b;
        return (Object.assign(Object.assign({}, bookmark.toObject()), { publisherId: Object.assign(Object.assign({}, (bookmark.publisherId || {})), { averageRating: ((_a = bookmark.publisherId) === null || _a === void 0 ? void 0 : _a.averageRating) || 0, totalReviews: ((_b = bookmark.publisherId) === null || _b === void 0 ? void 0 : _b.totalReviews) || 0 }) }));
    });
    return res.json(new ApiResponse_1.ApiResponse(200, {
        bookmarks: processedBookmarks,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
// Share functionality (track shares)
exports.sharePublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publisherId } = req.params;
    const { platform } = req.body; // 'linkedin', 'twitter', 'whatsapp', 'copy'
    const publisher = yield Publisher_1.Publisher.findById(publisherId);
    if (!publisher || !publisher.isPublished || !publisher.isMarketplaceListing) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
    }
    // Update share count (async)
    Publisher_1.Publisher.findByIdAndUpdate(publisherId, { $inc: { shareCount: 1 } }).exec().catch(err => console.error('Error updating share count:', err));
    const shareUrl = `${process.env.FRONTEND_URL}/publishers/${publisher.publicSlug}`;
    const shareText = `Check out ${publisher.name} - ${publisher.description}`;
    const shareUrls = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        copy: shareUrl
    };
    return res.json(new ApiResponse_1.ApiResponse(200, {
        shareUrl: shareUrls[platform] || shareUrl,
        message: 'Share URL generated successfully'
    }));
}));
exports.getOrderDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield Order_1.Order.findById(req.params.id);
    if (!order) {
        throw new ApiError_1.ApiError(404, 'Order not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, order));
}));
exports.verifyPayment = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const { reference } = req.query;
    if (!reference || typeof reference !== 'string') {
        throw new ApiError_1.ApiError(400, 'Payment reference is required');
    }
    // Verify payment with Paystack
    const paymentData = yield (0, paystack_1.verifyPaystackPayment)(reference);
    if (!paymentData || paymentData.status !== 'success') {
        throw new ApiError_1.ApiError(400, 'Payment verification failed or payment was not successful');
    }
    // Update order status to 'Completed'
    const order = yield Order_1.Order.findOneAndUpdate({ reference, user_id: req.user._id }, { $set: { status: 'Completed', payment_status: 'Successful' } }, { new: true });
    if (!order) {
        throw new ApiError_1.ApiError(404, 'Order not found');
    }
    // Record payment_completed step for the associated press release
    // If press_release_id is set, update only that press release
    // Otherwise, update all press releases for the user (backward compatibility)
    try {
        if (order.press_release_id) {
            console.log(`📍 Recording payment_completed for specific PR: ${order.press_release_id}`);
            yield (0, exports.recordProgressStep)(order.press_release_id, order.user_id, 'payment_completed', `Payment completed for press release distribution`, { payment_reference: reference, order_id: String(order._id) });
        }
        else {
            console.log(`📍 Recording payment_completed for all PRs of user: ${order.user_id}`);
            // Backward compatibility: update all press releases for the user
            const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: order.user_id });
            for (const pr of pressReleases) {
                yield (0, exports.recordProgressStep)(pr._id, order.user_id, 'payment_completed', `Payment completed for press release distribution`, { payment_reference: reference, order_id: String(order._id) });
            }
        }
    }
    catch (progressError) {
        console.error(`❌ Failed to record progress step for payment verification:`, progressError);
        // Don't throw - order was updated successfully, just log the error
    }
    // Clear the cart after successful payment verification
    yield Cart_1.Cart.findOneAndUpdate({ user_id: req.user._id }, { $set: { items: [] } });
    return res.json(new ApiResponse_1.ApiResponse(200, {
        order,
        message: 'Payment verified successfully. Cart has been cleared.'
    }));
}));
/**
 * Paystack Webhook - Called by Paystack server when payment is completed
 * This endpoint is PUBLIC but secured by Paystack signature verification
 *
 * Setup: Configure in Paystack dashboard:
 * - URL: https://yourdomain.com/api/v1/press-releases/webhooks/paystack
 * - Events: charge.success
 */
exports.paystackWebhook = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const signature = req.headers['x-paystack-signature'];
    const body = req.body;
    // Verify Paystack signature for security
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return res.status(500).json(new ApiResponse_1.ApiResponse(500, null, 'Webhook not configured'));
    }
    const hash = (0, crypto_1.createHmac)('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('hex');
    if (hash !== signature) {
        console.warn('Invalid Paystack signature attempt');
        return res.status(401).json(new ApiResponse_1.ApiResponse(401, null, 'Invalid signature'));
    }
    // Only process successful charges
    if (body.event !== 'charge.success') {
        return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Event ignored', event: body.event }));
    }
    const reference = (_a = body.data) === null || _a === void 0 ? void 0 : _a.reference;
    if (!reference) {
        console.warn('No reference in webhook payload');
        return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, 'No reference provided'));
    }
    try {
        // Find order by reference
        const order = yield Order_1.Order.findOne({ reference });
        if (!order) {
            console.warn(`Order not found for reference: ${reference}`);
            // Still return 200 OK to acknowledge webhook (Paystack will stop retrying)
            return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Order not found', reference }));
        }
        // Check if already processed (idempotency)
        if (order.status === 'Completed') {
            console.log(`Order ${reference} already completed, skipping duplicate webhook`);
            return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Order already completed', reference }));
        }
        // Update order status to 'Completed'
        order.status = 'Completed';
        order.payment_status = 'Successful';
        yield order.save();
        // Record payment_completed step for the associated press release
        // If press_release_id is set, update only that press release
        // Otherwise, update all press releases for the user (backward compatibility)
        if (order.press_release_id) {
            console.log(`📍 Recording payment_completed for specific PR: ${order.press_release_id}`);
            yield (0, exports.recordProgressStep)(order.press_release_id, order.user_id, 'payment_completed', `Payment completed for press release distribution`, { payment_reference: reference, order_id: String(order._id) });
        }
        else {
            console.log(`📍 Recording payment_completed for all PRs of user: ${order.user_id}`);
            // Backward compatibility: update all press releases for the user
            const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: order.user_id });
            for (const pr of pressReleases) {
                yield (0, exports.recordProgressStep)(pr._id, order.user_id, 'payment_completed', `Payment completed for press release distribution`, { payment_reference: reference, order_id: String(order._id) });
            }
        }
        // Clear the user's cart
        const cartUpdate = yield Cart_1.Cart.findOneAndUpdate({ user_id: order.user_id }, { $set: { items: [] } }, { new: true });
        console.log(`✅ Payment verified via webhook for order: ${reference}`);
        console.log(`   User: ${order.user_id}, Cart cleared, Items: ${order.items.length}`);
        return res.json(new ApiResponse_1.ApiResponse(200, {
            message: 'Webhook processed successfully',
            reference,
            order_id: order._id,
            timestamp: new Date()
        }));
    }
    catch (error) {
        console.error(`❌ Webhook processing error for ${reference}:`, error);
        // Return 200 to acknowledge we received it, but log the error
        return res.json(new ApiResponse_1.ApiResponse(500, null, 'Webhook processing failed'));
    }
}));
// Status configuration for the progress tracker
const STATUS_CONFIG = {
    completed: {
        icon: 'CheckCircle',
        color: '#10b981',
        textColor: '#065f46'
    },
    pending: {
        icon: 'Clock',
        color: '#f59e0b',
        textColor: '#92400e'
    },
    processing: {
        icon: 'Loader',
        color: '#3b82f6',
        textColor: '#1e40af'
    },
    review: {
        icon: 'Eye',
        color: '#8b5cf6',
        textColor: '#5b21b6'
    },
    rejected: {
        icon: 'XCircle',
        color: '#ef4444',
        textColor: '#991b1b'
    }
};
// Get press release tracker
exports.getPressReleaseTracker = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { prId } = req.params;
    // Validate ObjectId
    if (!mongoose_1.default.Types.ObjectId.isValid(prId)) {
        throw new ApiError_1.ApiError(400, 'Invalid press release ID');
    }
    const pressRelease = yield PressRelease_1.PressRelease.findOne({
        _id: prId,
        user_id: userId
    });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Get progress from PressReleaseProgress model
    const progress = yield (0, exports.getProgressTimeline)(new mongoose_1.default.Types.ObjectId(prId), userId);
    // Map ProgressStep to PressReleaseTrackerStatus
    const statusMapping = {
        'initiated': 'pending',
        'payment_pending': 'pending',
        'payment_completed': 'processing',
        'under_review': 'review',
        'approved': 'completed',
        'rejected': 'rejected'
    };
    // Map to progress percentage
    const progressMapping = {
        'initiated': 0,
        'payment_pending': 20,
        'payment_completed': 40,
        'under_review': 60,
        'approved': 100,
        'rejected': 100
    };
    let currentStatus = 'pending';
    let progressPercentage = 0;
    let statusHistory = [];
    let estimatedCompletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let actualCompletion;
    if (progress) {
        currentStatus = statusMapping[progress.current_step];
        progressPercentage = progressMapping[progress.current_step];
        // Build status history from progress_history
        statusHistory = progress.progress_history.map(record => ({
            status: statusMapping[record.step],
            timestamp: record.timestamp.toISOString(),
            notes: record.notes
        }));
        // Set actual completion
        if (progress.completed_at) {
            actualCompletion = progress.completed_at.toISOString();
        }
        else if (progress.rejected_at) {
            actualCompletion = progress.rejected_at.toISOString();
        }
    }
    else {
        // No progress record, use default initiated state
        statusHistory = [{
                status: 'pending',
                timestamp: pressRelease.date_created ? new Date(pressRelease.date_created).toISOString() : new Date().toISOString(),
                notes: 'Press release created'
            }];
    }
    // Build the tracker response
    const tracker = {
        _id: String(pressRelease._id),
        pr_id: String(pressRelease._id),
        title: pressRelease.title,
        current_status: currentStatus,
        status_history: statusHistory,
        progress_percentage: progressPercentage,
        estimated_completion: estimatedCompletion.toISOString(),
        actual_completion: actualCompletion,
        reviewers_count: 0, // Could be enhanced later
        distribution_outlets: ((_b = pressRelease.distribution_report) === null || _b === void 0 ? void 0 : _b.length) || 0,
        current_step: Math.floor(progressPercentage / 20) + 1,
        total_steps: 5
    };
    // Build timeline from status history
    const timeline = statusHistory.map(h => ({
        status: h.status,
        date: new Date(h.timestamp).toISOString().split('T')[0],
        description: `Status changed to ${h.status}${h.notes ? ': ' + h.notes : ''}`
    }));
    const response = {
        tracker,
        status_config: STATUS_CONFIG,
        timeline
    };
    return res.json(new ApiResponse_1.ApiResponse(200, response));
}));
// Update press release tracker status
exports.updatePressReleaseTrackerStatus = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { prId } = req.params;
    const { current_status, notes, progress_percentage, reviewers_count } = req.body;
    // Validate ObjectId
    if (!mongoose_1.default.Types.ObjectId.isValid(prId)) {
        throw new ApiError_1.ApiError(400, 'Invalid press release ID');
    }
    // Validate status
    const validStatuses = ['completed', 'pending', 'processing', 'review', 'rejected'];
    if (!validStatuses.includes(current_status)) {
        throw new ApiError_1.ApiError(400, 'Invalid status value');
    }
    const pressRelease = yield PressRelease_1.PressRelease.findOne({
        _id: prId,
        user_id: userId
    });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Initialize tracker if it doesn't exist
    if (!pressRelease.tracker) {
        pressRelease.tracker = {
            current_status: 'pending',
            status_history: [],
            progress_percentage: 0,
            estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            reviewers_count: 0
        };
    }
    // Ensure estimated_completion has a value
    if (!pressRelease.tracker.estimated_completion) {
        pressRelease.tracker.estimated_completion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    // Update tracker
    pressRelease.tracker.current_status = current_status;
    pressRelease.tracker.status_history.push({
        status: current_status,
        timestamp: new Date(),
        notes
    });
    if (progress_percentage !== undefined) {
        pressRelease.tracker.progress_percentage = Math.min(100, Math.max(0, progress_percentage));
    }
    if (reviewers_count !== undefined) {
        pressRelease.tracker.reviewers_count = reviewers_count;
    }
    // If status is completed, set actual_completion time
    if (current_status === 'completed') {
        pressRelease.tracker.actual_completion = new Date();
        pressRelease.tracker.progress_percentage = 100;
    }
    yield pressRelease.save();
    // Build response with proper null checks
    const updatedEstimatedCompletion = pressRelease.tracker.estimated_completion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tracker = {
        _id: String(pressRelease._id),
        pr_id: String(pressRelease._id),
        title: pressRelease.title,
        current_status: pressRelease.tracker.current_status,
        status_history: pressRelease.tracker.status_history.map((h) => ({
            status: h.status,
            timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
            notes: h.notes
        })),
        progress_percentage: pressRelease.tracker.progress_percentage,
        estimated_completion: updatedEstimatedCompletion.toISOString(),
        actual_completion: pressRelease.tracker.actual_completion ? new Date(pressRelease.tracker.actual_completion).toISOString() : undefined,
        reviewers_count: pressRelease.tracker.reviewers_count,
        distribution_outlets: pressRelease.distribution_report.length,
        current_step: Math.floor(pressRelease.tracker.progress_percentage / 20) + 1,
        total_steps: 5
    };
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: 'Tracker updated successfully',
        tracker
    }));
}));
// Get all press releases with tracker information
exports.getPressReleasesWithTracker = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId })
        .sort({ createdAt: -1 });
    // Get progress for all press releases
    const progressPromises = pressReleases.map(pr => (0, exports.getProgressTimeline)(pr._id, userId));
    const progresses = yield Promise.all(progressPromises);
    // Map ProgressStep to PressReleaseTrackerStatus
    const statusMapping = {
        'initiated': 'pending',
        'payment_pending': 'pending',
        'payment_completed': 'processing',
        'under_review': 'review',
        'approved': 'completed',
        'rejected': 'rejected'
    };
    // Map to progress percentage
    const progressMapping = {
        'initiated': 0,
        'payment_pending': 20,
        'payment_completed': 40,
        'under_review': 60,
        'approved': 100,
        'rejected': 100
    };
    const trackerList = pressReleases.map((pr, index) => {
        const progress = progresses[index];
        let trackerStatus = 'pending';
        let progressPercentage = 0;
        if (progress) {
            trackerStatus = statusMapping[progress.current_step];
            progressPercentage = progressMapping[progress.current_step];
        }
        return {
            _id: pr._id,
            title: pr.title,
            status: pr.status,
            tracker_status: trackerStatus,
            progress_percentage: progressPercentage,
            current_step: Math.floor(progressPercentage / 20) + 1,
            total_steps: 5
        };
    });
    return res.json(new ApiResponse_1.ApiResponse(200, {
        status_config: STATUS_CONFIG,
        trackers: trackerList
    }));
}));
/**
 * Get detailed progress timeline for a press release
 * Shows all steps: initiated, payment_pending, payment_completed, under_review, approved/rejected
 */
exports.getPressReleaseProgress = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { prId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(prId)) {
        throw new ApiError_1.ApiError(400, 'Invalid press release ID');
    }
    // Verify the press release belongs to the user
    const pressRelease = yield PressRelease_1.PressRelease.findOne({
        _id: prId,
        user_id: userId
    });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Get the progress timeline
    const progress = yield (0, exports.getProgressTimeline)(new mongoose_1.default.Types.ObjectId(prId), userId);
    // If no progress record found, create a draft response
    if (!progress) {
        console.log(`📋 No progress found for PR: ${prId}. Returning draft status.`);
        return res.json(new ApiResponse_1.ApiResponse(200, {
            press_release: {
                _id: pressRelease._id,
                title: pressRelease.title,
                status: pressRelease.status
            },
            progress: {
                current_step: 'initiated',
                initiated_at: new Date(pressRelease.date_created),
                payment_completed_at: null,
                under_review_at: null,
                completed_at: null,
                rejected_at: null,
                rejection_reason: null
            },
            timeline: [
                {
                    step: 'initiated',
                    timestamp: new Date(pressRelease.date_created),
                    notes: 'Draft saved. Complete payment to continue distribution.'
                }
            ],
            message: 'Draft is saved. Complete payment to continue.',
            status_message: 'Draft - Ready for payment',
            next_action: 'Complete payment for distribution'
        }));
    }
    // Format the response
    const response = {
        press_release: {
            _id: pressRelease._id,
            title: pressRelease.title,
            status: pressRelease.status
        },
        progress: {
            current_step: progress.current_step,
            initiated_at: progress.initiated_at,
            payment_completed_at: progress.payment_completed_at,
            under_review_at: progress.under_review_at,
            completed_at: progress.completed_at,
            rejected_at: progress.rejected_at,
            rejection_reason: progress.rejection_reason
        },
        timeline: progress.progress_history.map((record) => ({
            step: record.step,
            timestamp: record.timestamp,
            notes: record.notes,
            metadata: record.metadata
        })),
        step_descriptions: {
            'initiated': 'Press release created and initiated',
            'payment_pending': 'Awaiting payment for distribution',
            'payment_completed': 'Payment received successfully',
            'under_review': 'Press release under editorial review',
            'approved': 'Press release approved and published',
            'rejected': 'Press release rejected'
        }
    };
    return res.json(new ApiResponse_1.ApiResponse(200, response));
}));
/**
 * Update press release status to under_review (called by admin when reviewing)
 */
exports.updatePressReleaseToUnderReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prId } = req.params;
    const { notes } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(prId)) {
        throw new ApiError_1.ApiError(400, 'Invalid press release ID');
    }
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndUpdate(prId, {
        $set: {
            status: 'Pending',
            'tracker.current_status': 'review',
            'tracker.progress_percentage': 50
        }
    }, { new: true });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Record the step for all users' press releases in DB
    const prObjectId = new mongoose_1.default.Types.ObjectId(prId);
    const progressRecords = yield PressReleaseProgress_1.PressReleaseProgress.find({ press_release_id: prObjectId });
    for (const record of progressRecords) {
        yield (0, exports.recordProgressStep)(prObjectId, record.user_id, 'under_review', notes || 'Press release submitted for editorial review');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: 'Press release status updated to under review',
        press_release: pressRelease
    }));
}));
/**
 * Approve a press release (called by admin)
 */
exports.approvePressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prId } = req.params;
    const { notes } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(prId)) {
        throw new ApiError_1.ApiError(400, 'Invalid press release ID');
    }
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndUpdate(prId, {
        $set: {
            status: 'Published',
            'tracker.current_status': 'completed',
            'tracker.progress_percentage': 100,
            'tracker.actual_completion': new Date()
        }
    }, { new: true });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Record the approval step
    const prObjectId = new mongoose_1.default.Types.ObjectId(prId);
    const progressRecords = yield PressReleaseProgress_1.PressReleaseProgress.find({ press_release_id: prObjectId });
    for (const record of progressRecords) {
        yield (0, exports.recordProgressStep)(prObjectId, record.user_id, 'approved', notes || 'Press release approved and published', { approved_at: new Date() });
    }
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: 'Press release approved and published',
        press_release: pressRelease
    }));
}));
/**
 * Reject a press release (called by admin)
 */
exports.rejectPressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prId } = req.params;
    const { rejection_reason } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(prId)) {
        throw new ApiError_1.ApiError(400, 'Invalid press release ID');
    }
    if (!rejection_reason) {
        throw new ApiError_1.ApiError(400, 'Rejection reason is required');
    }
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndUpdate(prId, {
        $set: {
            status: 'Draft',
            'tracker.current_status': 'rejected',
            'tracker.progress_percentage': 0,
            'tracker.actual_completion': new Date()
        }
    }, { new: true });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Record the rejection step
    const prObjectId = new mongoose_1.default.Types.ObjectId(prId);
    const progressRecords = yield PressReleaseProgress_1.PressReleaseProgress.find({ press_release_id: prObjectId });
    for (const record of progressRecords) {
        yield (0, exports.recordProgressStep)(prObjectId, record.user_id, 'rejected', rejection_reason, { rejection_reason, rejected_at: new Date() });
    }
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: 'Press release rejected',
        press_release: pressRelease,
        rejection_reason
    }));
}));
/**
 * Get all press releases with full progress details
 */
exports.getAllPressReleasesWithProgress = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId })
        .sort({ createdAt: -1 });
    const progressList = yield Promise.all(pressReleases.map((pr) => __awaiter(void 0, void 0, void 0, function* () {
        const progress = yield (0, exports.getProgressTimeline)(pr._id, userId);
        const currentStep = (progress === null || progress === void 0 ? void 0 : progress.current_step) || 'initiated';
        // Determine status message based on current step
        let status_message = '';
        let next_action = '';
        if (!progress) {
            status_message = 'Draft - Ready for payment';
            next_action = 'Complete payment to continue distribution';
        }
        else {
            switch (currentStep) {
                case 'initiated':
                    status_message = 'Draft - Ready for payment';
                    next_action = 'Complete payment to continue distribution';
                    break;
                case 'payment_completed':
                    status_message = 'Payment received - Awaiting review';
                    next_action = 'Waiting for admin review';
                    break;
                case 'under_review':
                    status_message = 'Under review';
                    next_action = 'Pending admin decision';
                    break;
                case 'approved':
                    status_message = 'Published';
                    next_action = 'Successfully distributed';
                    break;
                case 'rejected':
                    status_message = 'Rejected - Needs revision';
                    next_action = `Reason: ${(progress === null || progress === void 0 ? void 0 : progress.rejection_reason) || 'See details for more info'}`;
                    break;
                default:
                    status_message = currentStep;
                    next_action = 'Check details';
            }
        }
        return {
            _id: pr._id,
            title: pr.title,
            status: pr.status,
            date_created: pr.date_created,
            current_step: currentStep,
            initiated_at: (progress === null || progress === void 0 ? void 0 : progress.initiated_at) || new Date(pr.date_created),
            payment_completed_at: progress === null || progress === void 0 ? void 0 : progress.payment_completed_at,
            under_review_at: progress === null || progress === void 0 ? void 0 : progress.under_review_at,
            completed_at: progress === null || progress === void 0 ? void 0 : progress.completed_at,
            rejected_at: progress === null || progress === void 0 ? void 0 : progress.rejected_at,
            rejection_reason: progress === null || progress === void 0 ? void 0 : progress.rejection_reason,
            total_steps_completed: (progress === null || progress === void 0 ? void 0 : progress.progress_history.length) || 1,
            status_message,
            next_action
        };
    })));
    return res.json(new ApiResponse_1.ApiResponse(200, {
        total: progressList.length,
        press_releases: progressList
    }));
}));
