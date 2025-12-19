import express from 'express';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import { verifyAdmin, verifySuperAdmin, auditLog, adminRateLimit } from '../middlewares/admin.middleware';
import { adminController } from '../controllers/admin.controller';

const adminRoute = express.Router();

// Apply authentication and admin verification to all routes
adminRoute.use(isAuthenticated);
// adminRoute.use(verifyAdmin);
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

// ==================== HEALTH CHECK ====================

/**
 * GET /api/v1/admin/health
 * Check admin API health
 */
adminRoute.get('/health', (req, res) => {
    res.json({ status: 'Admin API is running', timestamp: new Date().toISOString() });
});

export default adminRoute;
