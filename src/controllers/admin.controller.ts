import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import { PressRelease } from '../models/PressRelease';
import { Publisher } from '../models/Publisher';
import { Order } from '../models/Order';
import { Transaction } from '../models/Transaction';
import { CampaignModel } from '../models/Campaign';
import { UserModel } from '../models/User';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

/**
 * Admin Controller
 * Handles all admin operations including campaigns, press releases, payments, publisher marketplace management
 */

// ==================== CAMPAIGN MANAGEMENT ====================

/**
 * Get all campaigns (admin view)
 * Includes filters for status, date range, user
 */
export const getAllCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, startDate, endDate, userId, searchTerm, page = 1, limit = 20 } = req.query;

    // Build filter object
    const filter: any = {};

    if (status) filter.status = status;
    if (userId) filter.user_id = userId;

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (searchTerm) {
        filter.$or = [
            { campaignName: { $regex: searchTerm, $options: 'i' } },
            { subjectLine: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const campaigns = await CampaignModel.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await CampaignModel.countDocuments(filter);

    const formattedCampaigns = campaigns.map(campaign => ({
        _id: campaign._id,
        campaignName: campaign.campaignName,
        subjectLine: campaign.subjectLine,
        status: campaign.status,
        user: (campaign.user_id as any),
        audienceSize: campaign.audience?.emailLists?.length || 0,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
    }));

    return res.json(new ApiResponse(200, {
        campaigns: formattedCampaigns,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

// ==================== PUBLISHER MARKETPLACE MANAGEMENT ====================

/**
 * Get all publishers with marketplace features
 * GET /api/v1/admin/publishers
 */
export const getAllPublishers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { 
        level, 
        engagement, 
        delivery, 
        isPublished, 
        isMarketplaceListing,
        searchTerm,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1, 
        limit = 20 
    } = req.query;

    // Build filter object
    const filter: any = {};
    if (level) filter.level = level;
    if (engagement) filter.engagement = engagement;
    if (delivery) filter.delivery = delivery;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (isMarketplaceListing !== undefined) filter.isMarketplaceListing = isMarketplaceListing === 'true';
    
    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { coverage: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const publishers = await Publisher.find(filter)
        .populate('createdBy', 'email firstName lastName')
        .populate('updatedBy', 'email firstName lastName')
        .populate('reviews.reviewerId', 'email firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await Publisher.countDocuments(filter);

    return res.json(new ApiResponse(200, {
        publishers,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

/**
 * Get publisher details by ID
 * GET /api/v1/admin/publishers/:publisherId
 */
export const getPublisherDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const publisher = await Publisher.findById(publisherId)
        .populate('createdBy', 'email firstName lastName')
        .populate('updatedBy', 'email firstName lastName')
        .populate('reviews.reviewerId', 'email firstName lastName')
        .populate('reviews.moderatedBy', 'email firstName lastName');

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher));
});

/**
 * Create new publisher listing
 * POST /api/v1/admin/publishers
 */
export const createPublisher = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminUserId = req.user?._id || req.user?.id;
    if (!adminUserId) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin authentication required');
    }

    const {
        name,
        price,
        avg_publish_time,
        industry_focus,
        region_reach,
        audience_reach,
        key_features,
        metrics,
        // Marketplace fields
        logo,
        description,
        level,
        engagement,
        delivery,
        coverage,
        formatDepth,
        addOns,
        enhancedMetrics,
        faqs,
        metaTitle,
        metaDescription,
        socialImage,
        isMarketplaceListing = false
    } = req.body;

    // Validate required fields
    if (!name || !price || !avg_publish_time || !audience_reach) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing required fields: name, price, avg_publish_time, audience_reach');
    }

    const publisher = await Publisher.create({
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
        faqs: (faqs || []).map((faq: any, index: number) => ({
            ...faq,
            order: faq.order || index + 1
        })),
        metaTitle,
        metaDescription,
        socialImage,
        isMarketplaceListing: true,
        isPublished: true,
        createdBy: adminUserId
    });

    return res.json(new ApiResponse(201, publisher, 'Publisher created successfully'));
});

/**
 * Update publisher listing
 * PUT /api/v1/admin/publishers/:publisherId
 */
export const updatePublisher = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;
    const adminUserId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.publisherId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.createdBy;
    
    updateData.updatedBy = adminUserId;

    const publisher = await Publisher.findByIdAndUpdate(
        publisherId,
        updateData,
        { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'email firstName lastName');

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher, 'Publisher updated successfully'));
});

/**
 * Publish/unpublish publisher listing
 * PUT /api/v1/admin/publishers/:publisherId/publish
 */
export const togglePublisherStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;
    const { isPublished, publishedReason } = req.body;
    const adminUserId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const updateData: any = {
        isPublished: isPublished === true,
        updatedBy: adminUserId
    };

    if (isPublished === true) {
        updateData.publishedAt = new Date();
        updateData.isMarketplaceListing = true;
    } else {
        updateData.publishedAt = undefined;
    }

    const publisher = await Publisher.findByIdAndUpdate(
        publisherId,
        updateData,
        { new: true }
    );

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    const action = isPublished ? 'published' : 'unpublished';
    return res.json(new ApiResponse(200, publisher, `Publisher ${action} successfully`));
});

/**
 * Delete publisher (soft delete)
 * DELETE /api/v1/admin/publishers/:publisherId
 */
export const deletePublisher = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const publisher = await Publisher.findByIdAndDelete(publisherId);
    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, { message: 'Publisher deleted successfully' }));
});

/**
 * Manage publisher add-ons
 * PUT /api/v1/admin/publishers/:publisherId/addons
 */
export const updatePublisherAddons = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;
    const { addOns } = req.body;
    const adminUserId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const publisher = await Publisher.findByIdAndUpdate(
        publisherId,
        { 
            addOns,
            updatedBy: adminUserId
        },
        { new: true, runValidators: true }
    );

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher, 'Add-ons updated successfully'));
});

/**
 * Update publisher metrics
 * PUT /api/v1/admin/publishers/:publisherId/metrics
 */
export const updatePublisherMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;
    const { metrics, enhancedMetrics } = req.body;
    const adminUserId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const updateData: any = { updatedBy: adminUserId };
    if (metrics) updateData.metrics = metrics;
    if (enhancedMetrics) {
        updateData.enhancedMetrics = {
            ...enhancedMetrics,
            lastUpdated: new Date()
        };
    }

    const publisher = await Publisher.findByIdAndUpdate(
        publisherId,
        updateData,
        { new: true, runValidators: true }
    );

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher, 'Metrics updated successfully'));
});

/**
 * Manage publisher FAQs
 * PUT /api/v1/admin/publishers/:publisherId/faqs
 */
export const updatePublisherFAQs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId } = req.params;
    const { faqs } = req.body;
    const adminUserId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    // Ensure FAQs have proper order
    const orderedFAQs = (faqs || []).map((faq: any, index: number) => ({
        ...faq,
        order: faq.order || index + 1,
        isActive: faq.isActive !== undefined ? faq.isActive : true
    }));

    const publisher = await Publisher.findByIdAndUpdate(
        publisherId,
        { 
            faqs: orderedFAQs,
            updatedBy: adminUserId
        },
        { new: true, runValidators: true }
    );

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher, 'FAQs updated successfully'));
});

// ==================== PUBLISHER REVIEW MANAGEMENT ====================

/**
 * Get all publisher reviews (for moderation)
 * GET /api/v1/admin/reviews
 */
export const getAllPublisherReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { 
        publisherId,
        isModerated,
        isApproved,
        rating,
        page = 1, 
        limit = 20 
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const matchStage: any = {};
    if (publisherId) matchStage._id = new mongoose.Types.ObjectId(publisherId as string);

    const pipeline: any[] = [
        { $match: matchStage },
        { $unwind: '$reviews' },
        {
            $match: {
                ...(isModerated !== undefined && { 'reviews.isModerated': isModerated === 'true' }),
                ...(isApproved !== undefined && { 'reviews.isApproved': isApproved === 'true' }),
                ...(rating && { 'reviews.rating': parseInt(rating as string) })
            }
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

    const reviews = await Publisher.aggregate(pipeline);
    
    // Get total count
    const countPipeline: any[] = [
        { $match: matchStage },
        { $unwind: '$reviews' },
        {
            $match: {
                ...(isModerated !== undefined && { 'reviews.isModerated': isModerated === 'true' }),
                ...(isApproved !== undefined && { 'reviews.isApproved': isApproved === 'true' }),
                ...(rating && { 'reviews.rating': parseInt(rating as string) })
            }
        },
        { $count: 'total' }
    ];
    const totalResult = await Publisher.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    return res.json(new ApiResponse(200, {
        reviews,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

/**
 * Moderate review (approve/reject)
 * PUT /api/v1/admin/reviews/:publisherId/:reviewId/moderate
 */
export const moderateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId, reviewId } = req.params;
    const { isApproved, moderationNote } = req.body;
    const adminUserId = req.user?._id || req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const publisher = await Publisher.findOneAndUpdate(
        {
            _id: publisherId,
            'reviews._id': reviewId
        },
        {
            $set: {
                'reviews.$.isModerated': true,
                'reviews.$.isApproved': isApproved === true,
                'reviews.$.moderatedBy': adminUserId,
                'reviews.$.moderatedAt': new Date(),
                ...(moderationNote && { 'reviews.$.moderationNote': moderationNote })
            }
        },
        { new: true }
    );

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher or review not found');
    }

    const action = isApproved ? 'approved' : 'rejected';
    return res.json(new ApiResponse(200, publisher, `Review ${action} successfully`));
});

/**
 * Delete review
 * DELETE /api/v1/admin/reviews/:publisherId/:reviewId
 */
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { publisherId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(publisherId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid publisher ID');
    }

    const publisher = await Publisher.findByIdAndUpdate(
        publisherId,
        { $pull: { reviews: { _id: reviewId } } },
        { new: true }
    );

    if (!publisher) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, { message: 'Review deleted successfully' }));
});

// ==================== MARKETPLACE ANALYTICS ====================

/**
 * Get marketplace analytics
 * GET /api/v1/admin/marketplace/analytics
 */
export const getMarketplaceAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Publisher stats
    const totalPublishers = await Publisher.countDocuments();
    const publishedPublishers = await Publisher.countDocuments({ isPublished: true, isMarketplaceListing: true });
    const draftPublishers = await Publisher.countDocuments({ isPublished: false });

    // Review stats
    const reviewStatsPipeline: any[] = [
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
    const reviewStats = await Publisher.aggregate(reviewStatsPipeline);

    // Publisher performance
    const topPerformingPublishers = await Publisher.find({
        isPublished: true,
        isMarketplaceListing: true
    })
    .sort({ cartAddCount: -1, averageRating: -1 })
    .limit(10)
    .select('name cartAddCount viewCount averageRating conversionRate');

    // Add-on usage stats
    const addonStatsPipeline: any[] = [
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
    const addonStats = await Publisher.aggregate(addonStatsPipeline);

    return res.json(new ApiResponse(200, {
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
});

/**
 * Get campaign details by ID
 */
export const getCampaignDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid campaign ID');
    }

    const campaign = await CampaignModel.findById(campaignId)
        .populate('user_id', 'email firstName lastName');

    if (!campaign) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign not found');
    }

    return res.json(new ApiResponse(200, campaign));
});

/**
 * Change campaign status
 * Allowed transitions: Draft -> Scheduled -> Active -> Completed/Failed/Paused
 */
export const changeCampaignStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.params;
    const { newStatus, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid campaign ID');
    }

    const validStatuses = ['Draft', 'Scheduled', 'Active', 'Completed', 'Failed', 'Paused', 'Pending'];
    if (!validStatuses.includes(newStatus)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const campaign = await CampaignModel.findById(campaignId);
    if (!campaign) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign not found');
    }

    const oldStatus = campaign.status;
    campaign.status = newStatus;
    campaign.updatedAt = new Date();

    // Add status change to metadata if it exists
    if (!campaign.metadata) campaign.metadata = {};
    (campaign.metadata as any).lastStatusChange = {
        from: oldStatus,
        to: newStatus,
        changedAt: new Date(),
        changedBy: req.user?._id || req.user?.id,
        reason: reason || 'No reason provided'
    };

    await campaign.save();

    return res.json(new ApiResponse(200, {
        message: `Campaign status changed from ${oldStatus} to ${newStatus}`,
        campaign
    }));
});

export const deleteCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.params;
    const { softDelete = true } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid campaign ID');
    }

    const campaign = await CampaignModel.findById(campaignId);
    if (!campaign) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign not found');
    }

    if (softDelete) {
        // Soft delete - mark as deleted instead of removing
        campaign.status = 'Failed';
        (campaign as any).deletedAt = new Date();
        (campaign as any).deletedBy = req.user?._id || req.user?.id;
        await campaign.save();
        return res.json(new ApiResponse(200, { message: 'Campaign soft deleted' }));
    } else {
        // Hard delete
        await CampaignModel.findByIdAndDelete(campaignId);
        return res.json(new ApiResponse(200, { message: 'Campaign permanently deleted' }));
    }
});

/**
 * Get campaign statistics
 */
export const getCampaignStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await CampaignModel.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const totalCampaigns = await CampaignModel.countDocuments();
    const avgAudienceSize = await CampaignModel.aggregate([
        {
            $group: {
                _id: null,
                avgSize: { $avg: { $size: '$audience.emailLists' } }
            }
        }
    ]);

    return res.json(new ApiResponse(200, {
        totalCampaigns,
        byStatus: stats,
        averageAudienceSize: avgAudienceSize[0]?.avgSize || 0
    }));
});

// ==================== PRESS RELEASE MANAGEMENT ====================

/**
 * Get all press releases (admin view)
 */
export const getAllPressReleases = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, userId, searchTerm, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.user_id = userId;
    if (searchTerm) {
        filter.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const pressReleases = await PressRelease.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await PressRelease.countDocuments(filter);

    return res.json(new ApiResponse(200, {
        pressReleases,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

/**
 * Change press release status
 */
export const changePressReleaseStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pressReleaseId } = req.params;
    const { newStatus, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pressReleaseId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid press release ID');
    }

    const validStatuses = ['Draft', 'Published', 'Archived', 'Rejected'];
    if (!validStatuses.includes(newStatus)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const pressRelease = await PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Press release not found');
    }

    const oldStatus = pressRelease.status;
    pressRelease.status = newStatus;

    await pressRelease.save();

    return res.json(new ApiResponse(200, {
        message: `Press release status changed from ${oldStatus} to ${newStatus}`,
        pressRelease
    }));
});

/**
 * Delete press release
 */
export const deletePressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pressReleaseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pressReleaseId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid press release ID');
    }

    const pressRelease = await PressRelease.findByIdAndDelete(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Press release not found');
    }

    return res.json(new ApiResponse(200, { message: 'Press release deleted' }));
});

// ==================== PAYMENT MANAGEMENT ====================

/**
 * Get all payments/orders
 */
export const getAllPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentStatus, status, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (paymentStatus) filter.payment_status = paymentStatus;
    if (status) filter.status = status;
    if (userId) filter.user_id = userId;

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const payments = await Order.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await Order.countDocuments(filter);

    return res.json(new ApiResponse(200, {
        payments,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

/**
 * Get successful payments
 */
export const getSuccessfulPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter: any = {
        payment_status: 'Successful',
        status: 'Completed'
    };

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const successfulPayments = await Order.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await Order.countDocuments(filter);

    // Calculate total revenue
    const totalRevenue = successfulPayments.reduce((sum, payment) => {
        const amount = parseFloat(payment.order_summary.total_amount.replace(/[^0-9.-]+/g, '')) || 0;
        return sum + amount;
    }, 0);

    return res.json(new ApiResponse(200, {
        payments: successfulPayments,
        totalRevenue: `₦${totalRevenue.toLocaleString()}`,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

/**
 * Get payment statistics
 */
export const getPaymentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const totalOrders = await Order.countDocuments();
    const successfulOrders = await Order.countDocuments({ payment_status: 'Successful' });
    const failedOrders = await Order.countDocuments({ payment_status: 'Failed' });
    const pendingOrders = await Order.countDocuments({ payment_status: 'Pending' });

    const revenueStats = await Order.aggregate([
        { $match: { payment_status: 'Successful' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $toDouble: '$order_summary.total_amount' } },
                avgOrderValue: { $avg: { $toDouble: '$order_summary.total_amount' } }
            }
        }
    ]);

    const paymentMethodBreakdown = await Order.aggregate([
        {
            $group: {
                _id: '$payment_method',
                count: { $sum: 1 },
                totalAmount: { $sum: { $toDouble: '$order_summary.total_amount' } }
            }
        }
    ]);

    return res.json(new ApiResponse(200, {
        totalOrders,
        successfulOrders,
        failedOrders,
        pendingOrders,
        successRate: `${((successfulOrders / totalOrders) * 100).toFixed(2)}%`,
        totalRevenue: revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0 },
        paymentMethodBreakdown
    }));
});

/**
 * Update order status (admin only)
 */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const { status, paymentStatus, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid order ID');
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
    }

    if (status) {
        const validStatuses = ['Pending', 'Completed', 'Failed'];
        if (!validStatuses.includes(status)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
        }
        order.status = status;
    }

    if (paymentStatus) {
        const validPaymentStatuses = ['Pending', 'Successful', 'Failed'];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid payment status. Allowed: ${validPaymentStatuses.join(', ')}`);
        }
        order.payment_status = paymentStatus;
    }

    await order.save();

    return res.json(new ApiResponse(200, {
        message: 'Order status updated',
        order
    }));
});

/**
 * Get transactions
 */
export const getAllTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, userId, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.user_id = userId;
    if (type) filter.type = type;

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find(filter)
        .populate('user_id', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await Transaction.countDocuments(filter);

    return res.json(new ApiResponse(200, {
        transactions,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    }));
});

// ==================== SYSTEM MANAGEMENT ====================

/**
 * Get system overview/dashboard
 */
export const getSystemOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const totalUsers = await UserModel.countDocuments();
    const totalCampaigns = await CampaignModel.countDocuments();
    const totalPressReleases = await PressRelease.countDocuments();
    const totalOrders = await Order.countDocuments();
    const successfulOrders = await Order.countDocuments({ payment_status: 'Successful' });

    const campaignsByStatus = await CampaignModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const ordersByPaymentStatus = await Order.aggregate([
        { $group: { _id: '$payment_status', count: { $sum: 1 } } }
    ]);

    return res.json(new ApiResponse(200, {
        users: totalUsers,
        campaigns: totalCampaigns,
        pressReleases: totalPressReleases,
        orders: totalOrders,
        successfulOrders,
        campaignsByStatus,
        ordersByPaymentStatus
    }));
});

/**
 * Verify admin role (helper function for middleware)
 */
export const isAdmin = (req: AuthRequest): boolean => {
    return req.user?.role === 'admin' || req.user?.isAdmin === true;
};

export const adminController = {
    // Campaigns
    getAllCampaigns,
    getCampaignDetails,
    changeCampaignStatus,
    deleteCampaign,
    getCampaignStats,

    // Press Releases
    getAllPressReleases,
    changePressReleaseStatus,
    deletePressRelease,

    // Payments
    getAllPayments,
    getSuccessfulPayments,
    getPaymentStats,
    updateOrderStatus,
    getAllTransactions,

    // Publisher Marketplace
    getAllPublishers,
    getPublisherDetails,
    createPublisher,
    updatePublisher,
    togglePublisherStatus,
    deletePublisher,
    updatePublisherAddons,
    updatePublisherMetrics,
    updatePublisherFAQs,
    
    // Review Management
    getAllPublisherReviews,
    moderateReview,
    deleteReview,
    
    // Analytics
    getMarketplaceAnalytics,

    // System
    getSystemOverview
};
