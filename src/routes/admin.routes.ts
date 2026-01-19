import express from 'express';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import { verifyAdmin, verifySuperAdmin, auditLog, adminRateLimit } from '../middlewares/admin.middleware';
import { adminController } from '../controllers/admin.controller';

const adminRoute = express.Router();

// Apply authentication and admin verification to all routes
// adminRoute.use(isAuthenticated);
adminRoute.use(verifyAdmin);
adminRoute.use(adminRateLimit(1000, 60000)); // 1000 requests per minute for admins

// ==================== SYSTEM OVERVIEW ====================

/**
 * GET /api/v1/admin/overview
 * Get system dashboard overview
 */
adminRoute.get('/overview', auditLog('VIEW_SYSTEM_OVERVIEW'), adminController.getSystemOverview);

// ==================== CAMPAIGN MANAGEMENT ====================

/**
 * GET /api/v1/admin/campaigns
 * Get all campaigns with filters
 * Query params: status, startDate, endDate, userId, searchTerm, page, limit
 */
adminRoute.get('/campaigns', auditLog('LIST_ALL_CAMPAIGNS'), adminController.getAllCampaigns);

/**
 * GET /api/v1/admin/campaigns/:campaignId
 * Get campaign details
 */
adminRoute.get('/campaigns/:campaignId', auditLog('VIEW_CAMPAIGN_DETAILS'), adminController.getCampaignDetails);

/**
 * GET /api/v1/admin/campaigns/stats/overview
 * Get campaign statistics and overview
 */
adminRoute.get('/campaigns/stats/overview', auditLog('VIEW_CAMPAIGN_STATS'), adminController.getCampaignStats);

/**
 * PUT /api/v1/admin/campaigns/:campaignId/status
 * Change campaign status
 * Body: { newStatus, reason? }
 */
adminRoute.put(
    '/campaigns/:campaignId/status',
    auditLog('CHANGE_CAMPAIGN_STATUS'),
    adminController.changeCampaignStatus
);

/**
 * DELETE /api/v1/admin/campaigns/:campaignId
 * Delete campaign (supports soft/hard delete)
 * Body: { softDelete?: boolean }
 */
adminRoute.delete(
    '/campaigns/:campaignId',
    auditLog('DELETE_CAMPAIGN'),
    verifySuperAdmin, // Only super admin can delete
    adminController.deleteCampaign
);

// ==================== PRESS RELEASE MANAGEMENT ====================

/**
 * GET /api/v1/admin/press-releases
 * Get all press releases with filters
 * Query params: status, userId, searchTerm, page, limit
 */
adminRoute.get('/press-releases', auditLog('LIST_ALL_PRESS_RELEASES'), adminController.getAllPressReleases);

/**
 * PUT /api/v1/admin/press-releases/:pressReleaseId/status
 * Change press release status
 * Body: { newStatus, reason? }
 */
adminRoute.put(
    '/press-releases/:pressReleaseId/status',
    auditLog('CHANGE_PRESS_RELEASE_STATUS'),
    adminController.changePressReleaseStatus
);

/**
 * DELETE /api/v1/admin/press-releases/:pressReleaseId
 * Delete press release
 */
adminRoute.delete(
    '/press-releases/:pressReleaseId',
    auditLog('DELETE_PRESS_RELEASE'),
    verifySuperAdmin, // Only super admin can delete
    adminController.deletePressRelease
);

// ==================== PAYMENT MANAGEMENT ====================

/**
 * GET /api/v1/admin/payments
 * Get all payments/orders with filters
 * Query params: paymentStatus, status, userId, startDate, endDate, page, limit
 */
adminRoute.get('/payments', auditLog('LIST_ALL_PAYMENTS'), adminController.getAllPayments);

/**
 * GET /api/v1/admin/payments/successful
 * Get successful payments only
 * Query params: startDate, endDate, page, limit
 */
adminRoute.get('/payments/successful', auditLog('LIST_SUCCESSFUL_PAYMENTS'), adminController.getSuccessfulPayments);

/**
 * GET /api/v1/admin/payments/stats
 * Get payment statistics
 */
adminRoute.get('/payments/stats', auditLog('VIEW_PAYMENT_STATS'), adminController.getPaymentStats);

/**
 * PUT /api/v1/admin/payments/:orderId/status
 * Update order status (admin override)
 * Body: { status?, paymentStatus?, reason? }
 */
adminRoute.put(
    '/payments/:orderId/status',
    auditLog('UPDATE_ORDER_STATUS'),
    verifySuperAdmin, // Only super admin can override payment status
    adminController.updateOrderStatus
);

// ==================== TRANSACTION MANAGEMENT ====================

/**
 * GET /api/v1/admin/transactions
 * Get all transactions with filters
 * Query params: status, userId, type, startDate, endDate, page, limit
 */
adminRoute.get('/transactions', auditLog('LIST_ALL_TRANSACTIONS'), adminController.getAllTransactions);

// ==================== PUBLISHER MARKETPLACE MANAGEMENT ====================

/**
 * GET /api/v1/admin/publishers
 * Get all publishers with marketplace features
 * Query params: level, engagement, delivery, isPublished, isMarketplaceListing, searchTerm, sortBy, sortOrder, page, limit
 */
adminRoute.get('/publishers', auditLog('LIST_ALL_PUBLISHERS'), adminController.getAllPublishers);

/**
 * POST /api/v1/admin/publishers
 * Create new publisher listing
 * Body: { name, price, avg_publish_time, industry_focus, region_reach, audience_reach, key_features, metrics, logo, description, level, engagement, delivery, coverage, formatDepth, addOns, enhancedMetrics, faqs, metaTitle, metaDescription, socialImage, isMarketplaceListing }
 */
adminRoute.post('/publishers', auditLog('CREATE_PUBLISHER'), adminController.createPublisher);

/**
 * GET /api/v1/admin/publishers/:publisherId
 * Get publisher details by ID
 */
adminRoute.get('/publishers/:publisherId', auditLog('VIEW_PUBLISHER_DETAILS'), adminController.getPublisherDetails);

/**
 * PUT /api/v1/admin/publishers/:publisherId
 * Update publisher listing
 * Body: { any publisher fields to update }
 */
adminRoute.put('/publishers/:publisherId', auditLog('UPDATE_PUBLISHER'), adminController.updatePublisher);

/**
 * PUT /api/v1/admin/publishers/:publisherId/publish
 * Publish/unpublish publisher listing
 * Body: { isPublished: boolean, publishedReason?: string }
 */
adminRoute.put('/publishers/:publisherId/publish', auditLog('TOGGLE_PUBLISHER_STATUS'), adminController.togglePublisherStatus);

/**
 * DELETE /api/v1/admin/publishers/:publisherId
 * Delete publisher (soft delete)
 */
adminRoute.delete(
    '/publishers/:publisherId',
    auditLog('DELETE_PUBLISHER'),
    verifySuperAdmin, // Only super admin can delete
    adminController.deletePublisher
);

/**
 * PUT /api/v1/admin/publishers/:publisherId/addons
 * Manage publisher add-ons
 * Body: { addOns: { backdating: { enabled, price }, socialPosting: { enabled, price }, ... } }
 */
adminRoute.put('/publishers/:publisherId/addons', auditLog('UPDATE_PUBLISHER_ADDONS'), adminController.updatePublisherAddons);

/**
 * PUT /api/v1/admin/publishers/:publisherId/metrics
 * Update publisher metrics
 * Body: { metrics: { domain_authority, trust_score, ... }, enhancedMetrics: { ctrPercentage, bounceRatePercentage, ... } }
 */
adminRoute.put('/publishers/:publisherId/metrics', auditLog('UPDATE_PUBLISHER_METRICS'), adminController.updatePublisherMetrics);

/**
 * PUT /api/v1/admin/publishers/:publisherId/faqs
 * Manage publisher FAQs
 * Body: { faqs: [{ question, answer, order, isActive }] }
 */
adminRoute.put('/publishers/:publisherId/faqs', auditLog('UPDATE_PUBLISHER_FAQS'), adminController.updatePublisherFAQs);

// ==================== REVIEW MANAGEMENT ====================

/**
 * GET /api/v1/admin/reviews
 * Get all publisher reviews for moderation
 * Query params: publisherId, isModerated, isApproved, rating, page, limit
 */
adminRoute.get('/reviews', auditLog('LIST_PUBLISHER_REVIEWS'), adminController.getAllPublisherReviews);

/**
 * PUT /api/v1/admin/reviews/:publisherId/:reviewId/moderate
 * Moderate review (approve/reject)
 * Body: { isApproved: boolean, moderationNote?: string }
 */
adminRoute.put('/reviews/:publisherId/:reviewId/moderate', auditLog('MODERATE_REVIEW'), adminController.moderateReview);

/**
 * DELETE /api/v1/admin/reviews/:publisherId/:reviewId
 * Delete review
 */
adminRoute.delete(
    '/reviews/:publisherId/:reviewId',
    auditLog('DELETE_REVIEW'),
    verifySuperAdmin, // Only super admin can delete
    adminController.deleteReview
);

// ==================== MARKETPLACE ANALYTICS ====================

/**
 * GET /api/v1/admin/marketplace/analytics
 * Get marketplace analytics and insights
 * Query params: startDate, endDate
 */
adminRoute.get('/marketplace/analytics', auditLog('VIEW_MARKETPLACE_ANALYTICS'), adminController.getMarketplaceAnalytics);

// ==================== HEALTH CHECK ====================

/**
 * GET /api/v1/admin/health
 * Check admin API health
 */
adminRoute.get('/health', (req, res) => {
    res.json({ status: 'Admin API is running', timestamp: new Date().toISOString() });
});

export default adminRoute;
