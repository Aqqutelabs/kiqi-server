"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const admin_middleware_1 = require("../middlewares/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const adminRoute = express_1.default.Router();
// Apply authentication and admin verification to all routes
adminRoute.use(Auth_middlewares_1.isAuthenticated);
adminRoute.use(admin_middleware_1.verifyAdmin);
adminRoute.use((0, admin_middleware_1.adminRateLimit)(1000, 60000)); // 1000 requests per minute for admins
// ==================== SYSTEM OVERVIEW ====================
/**
 * GET /api/v1/admin/overview
 * Get system dashboard overview
 */
adminRoute.get('/overview', (0, admin_middleware_1.auditLog)('VIEW_SYSTEM_OVERVIEW'), admin_controller_1.adminController.getSystemOverview);
// ==================== CAMPAIGN MANAGEMENT ====================
/**
 * GET /api/v1/admin/campaigns
 * Get all campaigns with filters
 * Query params: status, startDate, endDate, userId, searchTerm, page, limit
 */
adminRoute.get('/campaigns', (0, admin_middleware_1.auditLog)('LIST_ALL_CAMPAIGNS'), admin_controller_1.adminController.getAllCampaigns);
/**
 * GET /api/v1/admin/campaigns/:campaignId
 * Get campaign details
 */
adminRoute.get('/campaigns/:campaignId', (0, admin_middleware_1.auditLog)('VIEW_CAMPAIGN_DETAILS'), admin_controller_1.adminController.getCampaignDetails);
/**
 * GET /api/v1/admin/campaigns/stats/overview
 * Get campaign statistics and overview
 */
adminRoute.get('/campaigns/stats/overview', (0, admin_middleware_1.auditLog)('VIEW_CAMPAIGN_STATS'), admin_controller_1.adminController.getCampaignStats);
/**
 * PUT /api/v1/admin/campaigns/:campaignId/status
 * Change campaign status
 * Body: { newStatus, reason? }
 */
adminRoute.put('/campaigns/:campaignId/status', (0, admin_middleware_1.auditLog)('CHANGE_CAMPAIGN_STATUS'), admin_controller_1.adminController.changeCampaignStatus);
/**
 * DELETE /api/v1/admin/campaigns/:campaignId
 * Delete campaign (supports soft/hard delete)
 * Body: { softDelete?: boolean }
 */
adminRoute.delete('/campaigns/:campaignId', (0, admin_middleware_1.auditLog)('DELETE_CAMPAIGN'), admin_middleware_1.verifySuperAdmin, // Only super admin can delete
admin_controller_1.adminController.deleteCampaign);
// ==================== PRESS RELEASE MANAGEMENT ====================
/**
 * GET /api/v1/admin/press-releases
 * Get all press releases with filters
 * Query params: status, userId, searchTerm, page, limit
 */
adminRoute.get('/press-releases', (0, admin_middleware_1.auditLog)('LIST_ALL_PRESS_RELEASES'), admin_controller_1.adminController.getAllPressReleases);
/**
 * PUT /api/v1/admin/press-releases/:pressReleaseId/status
 * Change press release status
 * Body: { newStatus, reason? }
 */
adminRoute.put('/press-releases/:pressReleaseId/status', (0, admin_middleware_1.auditLog)('CHANGE_PRESS_RELEASE_STATUS'), admin_controller_1.adminController.changePressReleaseStatus);
/**
 * DELETE /api/v1/admin/press-releases/:pressReleaseId
 * Delete press release
 */
adminRoute.delete('/press-releases/:pressReleaseId', (0, admin_middleware_1.auditLog)('DELETE_PRESS_RELEASE'), admin_middleware_1.verifySuperAdmin, // Only super admin can delete
admin_controller_1.adminController.deletePressRelease);
// ==================== PAYMENT MANAGEMENT ====================
/**
 * GET /api/v1/admin/payments
 * Get all payments/orders with filters
 * Query params: paymentStatus, status, userId, startDate, endDate, page, limit
 */
adminRoute.get('/payments', (0, admin_middleware_1.auditLog)('LIST_ALL_PAYMENTS'), admin_controller_1.adminController.getAllPayments);
/**
 * GET /api/v1/admin/payments/successful
 * Get successful payments only
 * Query params: startDate, endDate, page, limit
 */
adminRoute.get('/payments/successful', (0, admin_middleware_1.auditLog)('LIST_SUCCESSFUL_PAYMENTS'), admin_controller_1.adminController.getSuccessfulPayments);
/**
 * GET /api/v1/admin/payments/stats
 * Get payment statistics
 */
adminRoute.get('/payments/stats', (0, admin_middleware_1.auditLog)('VIEW_PAYMENT_STATS'), admin_controller_1.adminController.getPaymentStats);
/**
 * PUT /api/v1/admin/payments/:orderId/status
 * Update order status (admin override)
 * Body: { status?, paymentStatus?, reason? }
 */
adminRoute.put('/payments/:orderId/status', (0, admin_middleware_1.auditLog)('UPDATE_ORDER_STATUS'), admin_middleware_1.verifySuperAdmin, // Only super admin can override payment status
admin_controller_1.adminController.updateOrderStatus);
// ==================== TRANSACTION MANAGEMENT ====================
/**
 * GET /api/v1/admin/transactions
 * Get all transactions with filters
 * Query params: status, userId, type, startDate, endDate, page, limit
 */
adminRoute.get('/transactions', (0, admin_middleware_1.auditLog)('LIST_ALL_TRANSACTIONS'), admin_controller_1.adminController.getAllTransactions);
// ==================== PUBLISHER MARKETPLACE MANAGEMENT ====================
/**
 * GET /api/v1/admin/publishers
 * Get all publishers with marketplace features
 * Query params: level, engagement, delivery, isPublished, isMarketplaceListing, searchTerm, sortBy, sortOrder, page, limit
 */
adminRoute.get('/publishers', (0, admin_middleware_1.auditLog)('LIST_ALL_PUBLISHERS'), admin_controller_1.adminController.getAllPublishers);
/**
 * POST /api/v1/admin/publishers
 * Create new publisher listing
 * Body: { name, price, avg_publish_time, industry_focus, region_reach, audience_reach, key_features, metrics, logo, description, level, engagement, delivery, coverage, formatDepth, addOns, enhancedMetrics, faqs, metaTitle, metaDescription, socialImage, isMarketplaceListing }
 */
adminRoute.post('/publishers', (0, admin_middleware_1.auditLog)('CREATE_PUBLISHER'), admin_controller_1.adminController.createPublisher);
/**
 * GET /api/v1/admin/publishers/:publisherId
 * Get publisher details by ID
 */
adminRoute.get('/publishers/:publisherId', (0, admin_middleware_1.auditLog)('VIEW_PUBLISHER_DETAILS'), admin_controller_1.adminController.getPublisherDetails);
/**
 * PUT /api/v1/admin/publishers/:publisherId
 * Update publisher listing
 * Body: { any publisher fields to update }
 */
adminRoute.put('/publishers/:publisherId', (0, admin_middleware_1.auditLog)('UPDATE_PUBLISHER'), admin_controller_1.adminController.updatePublisher);
/**
 * PUT /api/v1/admin/publishers/:publisherId/publish
 * Publish/unpublish publisher listing
 * Body: { isPublished: boolean, publishedReason?: string }
 */
adminRoute.put('/publishers/:publisherId/publish', (0, admin_middleware_1.auditLog)('TOGGLE_PUBLISHER_STATUS'), admin_controller_1.adminController.togglePublisherStatus);
/**
 * DELETE /api/v1/admin/publishers/:publisherId
 * Delete publisher (soft delete)
 */
adminRoute.delete('/publishers/:publisherId', (0, admin_middleware_1.auditLog)('DELETE_PUBLISHER'), admin_middleware_1.verifySuperAdmin, // Only super admin can delete
admin_controller_1.adminController.deletePublisher);
/**
 * PUT /api/v1/admin/publishers/:publisherId/addons
 * Manage publisher add-ons
 * Body: { addOns: { backdating: { enabled, price }, socialPosting: { enabled, price }, ... } }
 */
adminRoute.put('/publishers/:publisherId/addons', (0, admin_middleware_1.auditLog)('UPDATE_PUBLISHER_ADDONS'), admin_controller_1.adminController.updatePublisherAddons);
/**
 * PUT /api/v1/admin/publishers/:publisherId/metrics
 * Update publisher metrics
 * Body: { metrics: { domain_authority, trust_score, ... }, enhancedMetrics: { ctrPercentage, bounceRatePercentage, ... } }
 */
adminRoute.put('/publishers/:publisherId/metrics', (0, admin_middleware_1.auditLog)('UPDATE_PUBLISHER_METRICS'), admin_controller_1.adminController.updatePublisherMetrics);
/**
 * PUT /api/v1/admin/publishers/:publisherId/faqs
 * Manage publisher FAQs
 * Body: { faqs: [{ question, answer, order, isActive }] }
 */
adminRoute.put('/publishers/:publisherId/faqs', (0, admin_middleware_1.auditLog)('UPDATE_PUBLISHER_FAQS'), admin_controller_1.adminController.updatePublisherFAQs);
// ==================== REVIEW MANAGEMENT ====================
/**
 * GET /api/v1/admin/reviews
 * Get all publisher reviews for moderation
 * Query params: publisherId, isModerated, isApproved, rating, page, limit
 */
adminRoute.get('/reviews', (0, admin_middleware_1.auditLog)('LIST_PUBLISHER_REVIEWS'), admin_controller_1.adminController.getAllPublisherReviews);
/**
 * PUT /api/v1/admin/reviews/:publisherId/:reviewId/moderate
 * Moderate review (approve/reject)
 * Body: { isApproved: boolean, moderationNote?: string }
 */
adminRoute.put('/reviews/:publisherId/:reviewId/moderate', (0, admin_middleware_1.auditLog)('MODERATE_REVIEW'), admin_controller_1.adminController.moderateReview);
/**
 * DELETE /api/v1/admin/reviews/:publisherId/:reviewId
 * Delete review
 */
adminRoute.delete('/reviews/:publisherId/:reviewId', (0, admin_middleware_1.auditLog)('DELETE_REVIEW'), admin_middleware_1.verifySuperAdmin, // Only super admin can delete
admin_controller_1.adminController.deleteReview);
// ==================== MARKETPLACE ANALYTICS ====================
/**
 * GET /api/v1/admin/marketplace/analytics
 * Get marketplace analytics and insights
 * Query params: startDate, endDate
 */
adminRoute.get('/marketplace/analytics', (0, admin_middleware_1.auditLog)('VIEW_MARKETPLACE_ANALYTICS'), admin_controller_1.adminController.getMarketplaceAnalytics);
// ==================== HEALTH CHECK ====================
/**
 * GET /api/v1/admin/health
 * Check admin API health
 */
adminRoute.get('/health', (req, res) => {
    res.json({ status: 'Admin API is running', timestamp: new Date().toISOString() });
});
exports.default = adminRoute;
