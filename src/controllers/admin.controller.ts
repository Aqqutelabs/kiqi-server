import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import { PressRelease } from '../models/PressRelease';
import { Order } from '../models/Order';
import { Transaction } from '../models/Transaction';
import { CampaignModel } from '../models/Campaign';
import { UserModel } from '../models/User';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

/**
 * Admin Controller
 * Handles all admin operations including campaigns, press releases, payments, and system management
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
        changedBy: req.user?._id,
        reason: reason || 'No reason provided'
    };

    await campaign.save();

    return res.json(new ApiResponse(200, {
        message: `Campaign status changed from ${oldStatus} to ${newStatus}`,
        campaign
    }));
});

/**
 * Delete campaign (soft delete recommended)
 */
export const deleteCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.params;
    const { softDelete = true } = req.body;

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
        (campaign as any).deletedBy = req.user?._id;
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

    // System
    getSystemOverview
};
