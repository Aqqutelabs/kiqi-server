"use strict";
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
exports.adminController = exports.isAdmin = exports.getSystemOverview = exports.getAllTransactions = exports.updateOrderStatus = exports.getPaymentStats = exports.getSuccessfulPayments = exports.getAllPayments = exports.deletePressRelease = exports.changePressReleaseStatus = exports.getAllPressReleases = exports.getCampaignStats = exports.deleteCampaign = exports.changeCampaignStatus = exports.getCampaignDetails = exports.getMarketplaceAnalytics = exports.deleteReview = exports.moderateReview = exports.getAllPublisherReviews = exports.updatePublisherFAQs = exports.updatePublisherMetrics = exports.updatePublisherAddons = exports.deletePublisher = exports.togglePublisherStatus = exports.updatePublisher = exports.createPublisher = exports.getPublisherDetails = exports.getAllPublishers = exports.getAllCampaigns = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const PressRelease_1 = require("../models/PressRelease");
const Publisher_1 = require("../models/Publisher");
const Order_1 = require("../models/Order");
const Transaction_1 = require("../models/Transaction");
const Campaign_1 = require("../models/Campaign");
const User_1 = require("../models/User");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Admin Controller
 * Handles all admin operations including campaigns, press releases, payments, publisher marketplace management
 */
// ==================== CAMPAIGN MANAGEMENT ====================
/**
 * Get all campaigns (admin view)
 * Includes filters for status, date range, user
 */
exports.getAllCampaigns = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, startDate, endDate, userId, searchTerm, page = 1, limit = 20 } = req.query;
    // Build filter object
    const filter = {};
    if (status)
        filter.status = status;
    if (userId)
        filter.user_id = userId;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    if (searchTerm) {
        filter.$or = [
            { campaignName: { $regex: searchTerm, $options: 'i' } },
            { subjectLine: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const campaigns = yield Campaign_1.CampaignModel.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield Campaign_1.CampaignModel.countDocuments(filter);
    const formattedCampaigns = campaigns.map(campaign => {
        var _a, _b;
        return ({
            _id: campaign._id,
            campaignName: campaign.campaignName,
            subjectLine: campaign.subjectLine,
            status: campaign.status,
            user: campaign.user_id,
            audienceSize: ((_b = (_a = campaign.audience) === null || _a === void 0 ? void 0 : _a.emailLists) === null || _b === void 0 ? void 0 : _b.length) || 0,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
        });
    });
    return res.json(new ApiResponse_1.ApiResponse(200, {
        campaigns: formattedCampaigns,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
// ==================== PUBLISHER MARKETPLACE MANAGEMENT ====================
/**
 * Get all publishers with marketplace features
 * GET /api/v1/admin/publishers
 */
exports.getAllPublishers = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { level, engagement, delivery, isPublished, isMarketplaceListing, searchTerm, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    // Build filter object
    const filter = {};
    if (level)
        filter.level = level;
    if (engagement)
        filter.engagement = engagement;
    if (delivery)
        filter.delivery = delivery;
    if (isPublished !== undefined)
        filter.isPublished = isPublished === 'true';
    if (isMarketplaceListing !== undefined)
        filter.isMarketplaceListing = isMarketplaceListing === 'true';
    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { coverage: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    const publishers = yield Publisher_1.Publisher.find(filter)
        .populate('createdBy', 'email firstName lastName')
        .populate('updatedBy', 'email firstName lastName')
        .populate('reviews.reviewerId', 'email firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield Publisher_1.Publisher.countDocuments(filter);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        publishers,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
/**
 * Get publisher details by ID
 * GET /api/v1/admin/publishers/:publisherId
 */
exports.getPublisherDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publisherId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const publisher = yield Publisher_1.Publisher.findById(publisherId)
        .populate('createdBy', 'email firstName lastName')
        .populate('updatedBy', 'email firstName lastName')
        .populate('reviews.reviewerId', 'email firstName lastName')
        .populate('reviews.moderatedBy', 'email firstName lastName');
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, publisher));
}));
/**
 * Create new publisher listing
 * POST /api/v1/admin/publishers
 */
exports.createPublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!adminUserId) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Admin authentication required');
    }
    const { name, price, avg_publish_time, industry_focus, region_reach, audience_reach, key_features, metrics, 
    // Marketplace fields
    logo, description, level, engagement, delivery, coverage, formatDepth, addOns, enhancedMetrics, faqs, metaTitle, metaDescription, socialImage, isMarketplaceListing = false } = req.body;
    // Validate required fields
    if (!name || !price || !avg_publish_time || !audience_reach) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Missing required fields: name, price, avg_publish_time, audience_reach');
    }
    const publisher = yield Publisher_1.Publisher.create({
        publisherId: `PUB${Date.now()}`,
        name,
        price,
        avg_publish_time,
        industry_focus: industry_focus || [],
        region_reach: region_reach || [],
        audience_reach,
        key_features: key_features || [],
        metrics: metrics || {
            domain_authority: 0,
            trust_score: 0,
            avg_traffic: 0,
            social_signals: 0
        },
        // Marketplace fields
        logo,
        description,
        level,
        engagement,
        delivery,
        coverage,
        formatDepth: formatDepth || [],
        addOns: addOns || {},
        enhancedMetrics,
        faqs: (faqs || []).map((faq, index) => (Object.assign(Object.assign({}, faq), { order: faq.order || index + 1 }))),
        metaTitle,
        metaDescription,
        socialImage,
        isMarketplaceListing: true,
        isPublished: true,
        createdBy: adminUserId
    });
    return res.json(new ApiResponse_1.ApiResponse(201, publisher, 'Publisher created successfully'));
}));
/**
 * Update publisher listing
 * PUT /api/v1/admin/publishers/:publisherId
 */
exports.updatePublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { publisherId } = req.params;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const updateData = Object.assign({}, req.body);
    delete updateData._id;
    delete updateData.publisherId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.createdBy;
    updateData.updatedBy = adminUserId;
    const publisher = yield Publisher_1.Publisher.findByIdAndUpdate(publisherId, updateData, { new: true, runValidators: true }).populate('createdBy updatedBy', 'email firstName lastName');
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, publisher, 'Publisher updated successfully'));
}));
/**
 * Publish/unpublish publisher listing
 * PUT /api/v1/admin/publishers/:publisherId/publish
 */
exports.togglePublisherStatus = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { publisherId } = req.params;
    const { isPublished, publishedReason } = req.body;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const updateData = {
        isPublished: isPublished === true,
        updatedBy: adminUserId
    };
    if (isPublished === true) {
        updateData.publishedAt = new Date();
        updateData.isMarketplaceListing = true;
    }
    else {
        updateData.publishedAt = undefined;
    }
    const publisher = yield Publisher_1.Publisher.findByIdAndUpdate(publisherId, updateData, { new: true });
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    const action = isPublished ? 'published' : 'unpublished';
    return res.json(new ApiResponse_1.ApiResponse(200, publisher, `Publisher ${action} successfully`));
}));
/**
 * Delete publisher (soft delete)
 * DELETE /api/v1/admin/publishers/:publisherId
 */
exports.deletePublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publisherId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const publisher = yield Publisher_1.Publisher.findByIdAndDelete(publisherId);
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Publisher deleted successfully' }));
}));
/**
 * Manage publisher add-ons
 * PUT /api/v1/admin/publishers/:publisherId/addons
 */
exports.updatePublisherAddons = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { publisherId } = req.params;
    const { addOns } = req.body;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const publisher = yield Publisher_1.Publisher.findByIdAndUpdate(publisherId, {
        addOns,
        updatedBy: adminUserId
    }, { new: true, runValidators: true });
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, publisher, 'Add-ons updated successfully'));
}));
/**
 * Update publisher metrics
 * PUT /api/v1/admin/publishers/:publisherId/metrics
 */
exports.updatePublisherMetrics = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { publisherId } = req.params;
    const { metrics, enhancedMetrics } = req.body;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const updateData = { updatedBy: adminUserId };
    if (metrics)
        updateData.metrics = metrics;
    if (enhancedMetrics) {
        updateData.enhancedMetrics = Object.assign(Object.assign({}, enhancedMetrics), { lastUpdated: new Date() });
    }
    const publisher = yield Publisher_1.Publisher.findByIdAndUpdate(publisherId, updateData, { new: true, runValidators: true });
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, publisher, 'Metrics updated successfully'));
}));
/**
 * Manage publisher FAQs
 * PUT /api/v1/admin/publishers/:publisherId/faqs
 */
exports.updatePublisherFAQs = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { publisherId } = req.params;
    const { faqs } = req.body;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    // Ensure FAQs have proper order
    const orderedFAQs = (faqs || []).map((faq, index) => (Object.assign(Object.assign({}, faq), { order: faq.order || index + 1, isActive: faq.isActive !== undefined ? faq.isActive : true })));
    const publisher = yield Publisher_1.Publisher.findByIdAndUpdate(publisherId, {
        faqs: orderedFAQs,
        updatedBy: adminUserId
    }, { new: true, runValidators: true });
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, publisher, 'FAQs updated successfully'));
}));
// ==================== PUBLISHER REVIEW MANAGEMENT ====================
/**
 * Get all publisher reviews (for moderation)
 * GET /api/v1/admin/reviews
 */
exports.getAllPublisherReviews = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { publisherId, isModerated, isApproved, rating, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const matchStage = {};
    if (publisherId)
        matchStage._id = new mongoose_1.default.Types.ObjectId(publisherId);
    const pipeline = [
        { $match: matchStage },
        { $unwind: '$reviews' },
        {
            $match: Object.assign(Object.assign(Object.assign({}, (isModerated !== undefined && { 'reviews.isModerated': isModerated === 'true' })), (isApproved !== undefined && { 'reviews.isApproved': isApproved === 'true' })), (rating && { 'reviews.rating': parseInt(rating) }))
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.reviewerId',
                foreignField: '_id',
                as: 'reviewerInfo'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.moderatedBy',
                foreignField: '_id',
                as: 'moderatorInfo'
            }
        },
        {
            $project: {
                publisherId: '$_id',
                publisherName: '$name',
                review: '$reviews',
                reviewer: { $arrayElemAt: ['$reviewerInfo', 0] },
                moderator: { $arrayElemAt: ['$moderatorInfo', 0] }
            }
        },
        { $sort: { 'review.timestamp': -1 } },
        { $skip: skip },
        { $limit: limitNum }
    ];
    const reviews = yield Publisher_1.Publisher.aggregate(pipeline);
    // Get total count
    const countPipeline = [
        { $match: matchStage },
        { $unwind: '$reviews' },
        {
            $match: Object.assign(Object.assign(Object.assign({}, (isModerated !== undefined && { 'reviews.isModerated': isModerated === 'true' })), (isApproved !== undefined && { 'reviews.isApproved': isApproved === 'true' })), (rating && { 'reviews.rating': parseInt(rating) }))
        },
        { $count: 'total' }
    ];
    const totalResult = yield Publisher_1.Publisher.aggregate(countPipeline);
    const total = ((_a = totalResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    return res.json(new ApiResponse_1.ApiResponse(200, {
        reviews,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
/**
 * Moderate review (approve/reject)
 * PUT /api/v1/admin/reviews/:publisherId/:reviewId/moderate
 */
exports.moderateReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { publisherId, reviewId } = req.params;
    const { isApproved, moderationNote } = req.body;
    const adminUserId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const publisher = yield Publisher_1.Publisher.findOneAndUpdate({
        _id: publisherId,
        'reviews._id': reviewId
    }, {
        $set: Object.assign({ 'reviews.$.isModerated': true, 'reviews.$.isApproved': isApproved === true, 'reviews.$.moderatedBy': adminUserId, 'reviews.$.moderatedAt': new Date() }, (moderationNote && { 'reviews.$.moderationNote': moderationNote }))
    }, { new: true });
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher or review not found');
    }
    const action = isApproved ? 'approved' : 'rejected';
    return res.json(new ApiResponse_1.ApiResponse(200, publisher, `Review ${action} successfully`));
}));
/**
 * Delete review
 * DELETE /api/v1/admin/reviews/:publisherId/:reviewId
 */
exports.deleteReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publisherId, reviewId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }
    const publisher = yield Publisher_1.Publisher.findByIdAndUpdate(publisherId, { $pull: { reviews: { _id: reviewId } } }, { new: true });
    if (!publisher) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Review deleted successfully' }));
}));
// ==================== MARKETPLACE ANALYTICS ====================
/**
 * Get marketplace analytics
 * GET /api/v1/admin/marketplace/analytics
 */
exports.getMarketplaceAnalytics = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate)
        dateFilter.$gte = new Date(startDate);
    if (endDate)
        dateFilter.$lte = new Date(endDate);
    // Publisher stats
    const totalPublishers = yield Publisher_1.Publisher.countDocuments();
    const publishedPublishers = yield Publisher_1.Publisher.countDocuments({ isPublished: true, isMarketplaceListing: true });
    const draftPublishers = yield Publisher_1.Publisher.countDocuments({ isPublished: false });
    // Review stats
    const reviewStatsPipeline = [
        { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                totalReviews: { $sum: { $cond: [{ $ifNull: ['$reviews', false] }, 1, 0] } },
                approvedReviews: { $sum: { $cond: [{ $eq: ['$reviews.isApproved', true] }, 1, 0] } },
                pendingReviews: { $sum: { $cond: [{ $eq: ['$reviews.isModerated', false] }, 1, 0] } },
                averageRating: { $avg: { $cond: [{ $eq: ['$reviews.isApproved', true] }, '$reviews.rating', null] } }
            }
        }
    ];
    const reviewStats = yield Publisher_1.Publisher.aggregate(reviewStatsPipeline);
    // Publisher performance
    const topPerformingPublishers = yield Publisher_1.Publisher.find({
        isPublished: true,
        isMarketplaceListing: true
    })
        .sort({ cartAddCount: -1, averageRating: -1 })
        .limit(10)
        .select('name cartAddCount viewCount averageRating conversionRate');
    // Add-on usage stats
    const addonStatsPipeline = [
        { $match: { isMarketplaceListing: true } },
        {
            $project: {
                hasBackdating: { $ne: [{ $ifNull: ['$addOns.backdating.enabled', false] }, false] },
                hasSocialPosting: { $ne: [{ $ifNull: ['$addOns.socialPosting.enabled', false] }, false] },
                hasFeaturedPlacement: { $ne: [{ $ifNull: ['$addOns.featuredPlacement.enabled', false] }, false] },
                hasNewsletter: { $ne: [{ $ifNull: ['$addOns.newsletterInclusion.enabled', false] }, false] },
                hasAuthorByline: { $ne: [{ $ifNull: ['$addOns.authorByline.enabled', false] }, false] },
                hasPaidAmplification: { $ne: [{ $ifNull: ['$addOns.paidAmplification.enabled', false] }, false] },
                hasWhitePaper: { $ne: [{ $ifNull: ['$addOns.whitePaperGating.enabled', false] }, false] }
            }
        },
        {
            $group: {
                _id: null,
                backdating: { $sum: { $cond: ['$hasBackdating', 1, 0] } },
                socialPosting: { $sum: { $cond: ['$hasSocialPosting', 1, 0] } },
                featuredPlacement: { $sum: { $cond: ['$hasFeaturedPlacement', 1, 0] } },
                newsletter: { $sum: { $cond: ['$hasNewsletter', 1, 0] } },
                authorByline: { $sum: { $cond: ['$hasAuthorByline', 1, 0] } },
                paidAmplification: { $sum: { $cond: ['$hasPaidAmplification', 1, 0] } },
                whitePaper: { $sum: { $cond: ['$hasWhitePaper', 1, 0] } }
            }
        }
    ];
    const addonStats = yield Publisher_1.Publisher.aggregate(addonStatsPipeline);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        publisherStats: {
            total: totalPublishers,
            published: publishedPublishers,
            draft: draftPublishers
        },
        reviewStats: reviewStats[0] || {
            totalReviews: 0,
            approvedReviews: 0,
            pendingReviews: 0,
            averageRating: 0
        },
        topPublishers: topPerformingPublishers,
        addonUsage: addonStats[0] || {}
    }));
}));
/**
 * Get campaign details by ID
 */
exports.getCampaignDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid campaign ID');
    }
    const campaign = yield Campaign_1.CampaignModel.findById(campaignId)
        .populate('user_id', 'email firstName lastName');
    if (!campaign) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Campaign not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, campaign));
}));
/**
 * Change campaign status
 * Allowed transitions: Draft -> Scheduled -> Active -> Completed/Failed/Paused
 */
exports.changeCampaignStatus = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { campaignId } = req.params;
    const { newStatus, reason } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid campaign ID');
    }
    const validStatuses = ['Draft', 'Scheduled', 'Active', 'Completed', 'Failed', 'Paused', 'Pending'];
    if (!validStatuses.includes(newStatus)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }
    const campaign = yield Campaign_1.CampaignModel.findById(campaignId);
    if (!campaign) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Campaign not found');
    }
    const oldStatus = campaign.status;
    campaign.status = newStatus;
    campaign.updatedAt = new Date();
    // Add status change to metadata if it exists
    if (!campaign.metadata)
        campaign.metadata = {};
    campaign.metadata.lastStatusChange = {
        from: oldStatus,
        to: newStatus,
        changedAt: new Date(),
        changedBy: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id),
        reason: reason || 'No reason provided'
    };
    yield campaign.save();
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: `Campaign status changed from ${oldStatus} to ${newStatus}`,
        campaign
    }));
}));
exports.deleteCampaign = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { campaignId } = req.params;
    const { softDelete = true } = req.body || {};
    if (!mongoose_1.default.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid campaign ID');
    }
    const campaign = yield Campaign_1.CampaignModel.findById(campaignId);
    if (!campaign) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Campaign not found');
    }
    if (softDelete) {
        // Soft delete - mark as deleted instead of removing
        campaign.status = 'Failed';
        campaign.deletedAt = new Date();
        campaign.deletedBy = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        yield campaign.save();
        return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Campaign soft deleted' }));
    }
    else {
        // Hard delete
        yield Campaign_1.CampaignModel.findByIdAndDelete(campaignId);
        return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Campaign permanently deleted' }));
    }
}));
/**
 * Get campaign statistics
 */
exports.getCampaignStats = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const stats = yield Campaign_1.CampaignModel.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    const totalCampaigns = yield Campaign_1.CampaignModel.countDocuments();
    const avgAudienceSize = yield Campaign_1.CampaignModel.aggregate([
        {
            $group: {
                _id: null,
                avgSize: { $avg: { $size: '$audience.emailLists' } }
            }
        }
    ]);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        totalCampaigns,
        byStatus: stats,
        averageAudienceSize: ((_a = avgAudienceSize[0]) === null || _a === void 0 ? void 0 : _a.avgSize) || 0
    }));
}));
// ==================== PRESS RELEASE MANAGEMENT ====================
/**
 * Get all press releases (admin view)
 */
exports.getAllPressReleases = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, userId, searchTerm, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    if (userId)
        filter.user_id = userId;
    if (searchTerm) {
        filter.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const pressReleases = yield PressRelease_1.PressRelease.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield PressRelease_1.PressRelease.countDocuments(filter);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        pressReleases,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
/**
 * Change press release status
 */
exports.changePressReleaseStatus = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pressReleaseId } = req.params;
    const { newStatus, reason } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(pressReleaseId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid press release ID');
    }
    const validStatuses = ['Draft', 'Published', 'Archived', 'Rejected'];
    if (!validStatuses.includes(newStatus)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }
    const pressRelease = yield PressRelease_1.PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Press release not found');
    }
    const oldStatus = pressRelease.status;
    pressRelease.status = newStatus;
    yield pressRelease.save();
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: `Press release status changed from ${oldStatus} to ${newStatus}`,
        pressRelease
    }));
}));
/**
 * Delete press release
 */
exports.deletePressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pressReleaseId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(pressReleaseId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid press release ID');
    }
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndDelete(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Press release not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Press release deleted' }));
}));
// ==================== PAYMENT MANAGEMENT ====================
/**
 * Get all payments/orders
 */
exports.getAllPayments = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentStatus, status, userId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (paymentStatus)
        filter.payment_status = paymentStatus;
    if (status)
        filter.status = status;
    if (userId)
        filter.user_id = userId;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const payments = yield Order_1.Order.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield Order_1.Order.countDocuments(filter);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        payments,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
/**
 * Get successful payments
 */
exports.getSuccessfulPayments = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {
        payment_status: 'Successful',
        status: 'Completed'
    };
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const successfulPayments = yield Order_1.Order.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield Order_1.Order.countDocuments(filter);
    // Calculate total revenue
    const totalRevenue = successfulPayments.reduce((sum, payment) => {
        const amount = parseFloat(payment.order_summary.total_amount.replace(/[^0-9.-]+/g, '')) || 0;
        return sum + amount;
    }, 0);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        payments: successfulPayments,
        totalRevenue: `₦${totalRevenue.toLocaleString()}`,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
/**
 * Get payment statistics
 */
exports.getPaymentStats = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const totalOrders = yield Order_1.Order.countDocuments();
    const successfulOrders = yield Order_1.Order.countDocuments({ payment_status: 'Successful' });
    const failedOrders = yield Order_1.Order.countDocuments({ payment_status: 'Failed' });
    const pendingOrders = yield Order_1.Order.countDocuments({ payment_status: 'Pending' });
    const revenueStats = yield Order_1.Order.aggregate([
        { $match: { payment_status: 'Successful' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $toDouble: '$order_summary.total_amount' } },
                avgOrderValue: { $avg: { $toDouble: '$order_summary.total_amount' } }
            }
        }
    ]);
    const paymentMethodBreakdown = yield Order_1.Order.aggregate([
        {
            $group: {
                _id: '$payment_method',
                count: { $sum: 1 },
                totalAmount: { $sum: { $toDouble: '$order_summary.total_amount' } }
            }
        }
    ]);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        totalOrders,
        successfulOrders,
        failedOrders,
        pendingOrders,
        successRate: `${((successfulOrders / totalOrders) * 100).toFixed(2)}%`,
        totalRevenue: revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0 },
        paymentMethodBreakdown
    }));
}));
/**
 * Update order status (admin only)
 */
exports.updateOrderStatus = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const { status, paymentStatus, reason } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid order ID');
    }
    const order = yield Order_1.Order.findById(orderId);
    if (!order) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Order not found');
    }
    if (status) {
        const validStatuses = ['Pending', 'Completed', 'Failed'];
        if (!validStatuses.includes(status)) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
        }
        order.status = status;
    }
    if (paymentStatus) {
        const validPaymentStatuses = ['Pending', 'Successful', 'Failed'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid payment status. Allowed: ${validPaymentStatuses.join(', ')}`);
        }
        order.payment_status = paymentStatus;
    }
    yield order.save();
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: 'Order status updated',
        order
    }));
}));
/**
 * Get transactions
 */
exports.getAllTransactions = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, userId, type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    if (userId)
        filter.user_id = userId;
    if (type)
        filter.type = type;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const transactions = yield Transaction_1.Transaction.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    const total = yield Transaction_1.Transaction.countDocuments(filter);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        transactions,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
}));
// ==================== SYSTEM MANAGEMENT ====================
/**
 * Get system overview/dashboard
 */
exports.getSystemOverview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const totalUsers = yield User_1.UserModel.countDocuments();
    const totalCampaigns = yield Campaign_1.CampaignModel.countDocuments();
    const totalPressReleases = yield PressRelease_1.PressRelease.countDocuments();
    const totalOrders = yield Order_1.Order.countDocuments();
    const successfulOrders = yield Order_1.Order.countDocuments({ payment_status: 'Successful' });
    const campaignsByStatus = yield Campaign_1.CampaignModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const ordersByPaymentStatus = yield Order_1.Order.aggregate([
        { $group: { _id: '$payment_status', count: { $sum: 1 } } }
    ]);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        users: totalUsers,
        campaigns: totalCampaigns,
        pressReleases: totalPressReleases,
        orders: totalOrders,
        successfulOrders,
        campaignsByStatus,
        ordersByPaymentStatus
    }));
}));
/**
 * Verify admin role (helper function for middleware)
 */
const isAdmin = (req) => {
    var _a, _b;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin' || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.isAdmin) === true;
};
exports.isAdmin = isAdmin;
exports.adminController = {
    // Campaigns
    getAllCampaigns: exports.getAllCampaigns,
    getCampaignDetails: exports.getCampaignDetails,
    changeCampaignStatus: exports.changeCampaignStatus,
    deleteCampaign: exports.deleteCampaign,
    getCampaignStats: exports.getCampaignStats,
    // Press Releases
    getAllPressReleases: exports.getAllPressReleases,
    changePressReleaseStatus: exports.changePressReleaseStatus,
    deletePressRelease: exports.deletePressRelease,
    // Payments
    getAllPayments: exports.getAllPayments,
    getSuccessfulPayments: exports.getSuccessfulPayments,
    getPaymentStats: exports.getPaymentStats,
    updateOrderStatus: exports.updateOrderStatus,
    getAllTransactions: exports.getAllTransactions,
    // Publisher Marketplace
    getAllPublishers: exports.getAllPublishers,
    getPublisherDetails: exports.getPublisherDetails,
    createPublisher: exports.createPublisher,
    updatePublisher: exports.updatePublisher,
    togglePublisherStatus: exports.togglePublisherStatus,
    deletePublisher: exports.deletePublisher,
    updatePublisherAddons: exports.updatePublisherAddons,
    updatePublisherMetrics: exports.updatePublisherMetrics,
    updatePublisherFAQs: exports.updatePublisherFAQs,
    // Review Management
    getAllPublisherReviews: exports.getAllPublisherReviews,
    moderateReview: exports.moderateReview,
    deleteReview: exports.deleteReview,
    // Analytics
    getMarketplaceAnalytics: exports.getMarketplaceAnalytics,
    // System
    getSystemOverview: exports.getSystemOverview
};
