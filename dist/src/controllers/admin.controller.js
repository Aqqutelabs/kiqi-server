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
exports.adminController = exports.isAdmin = exports.getSystemOverview = exports.getAllTransactions = exports.updateOrderStatus = exports.getPaymentStats = exports.getSuccessfulPayments = exports.getAllPayments = exports.deletePressRelease = exports.changePressReleaseStatus = exports.getAllPressReleases = exports.getCampaignStats = exports.deleteCampaign = exports.changeCampaignStatus = exports.getCampaignDetails = exports.getAllCampaigns = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const PressRelease_1 = require("../models/PressRelease");
const Order_1 = require("../models/Order");
const Transaction_1 = require("../models/Transaction");
const Campaign_1 = require("../models/Campaign");
const User_1 = require("../models/User");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Admin Controller
 * Handles all admin operations including campaigns, press releases, payments, and system management
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
    var _a;
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
        changedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        reason: reason || 'No reason provided'
    };
    yield campaign.save();
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: `Campaign status changed from ${oldStatus} to ${newStatus}`,
        campaign
    }));
}));
/**
 * Delete campaign (soft delete recommended)
 */
exports.deleteCampaign = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { campaignId } = req.params;
    const { softDelete = true } = req.body;
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
        campaign.deletedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
    // System
    getSystemOverview: exports.getSystemOverview
};
