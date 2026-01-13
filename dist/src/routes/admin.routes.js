"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_middleware_1 = require("../middlewares/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const adminRoute = express_1.default.Router();
// Apply authentication and admin verification to all routes
//adminRoute.use(isAuthenticated);
// adminRoute.use(verifyAdmin);
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
// ==================== HEALTH CHECK ====================
/**
 * GET /api/v1/admin/health
 * Check admin API health
 */
adminRoute.get('/health', (req, res) => {
    res.json({ status: 'Admin API is running', timestamp: new Date().toISOString() });
});
exports.default = adminRoute;
