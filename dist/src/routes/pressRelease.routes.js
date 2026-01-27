"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const pressRelease_controller_1 = require("../controllers/pressRelease.controller");
const review_controller_1 = require("../controllers/review.controller");
const pressRelease_validation_1 = require("../validation/pressRelease.validation");
const cart_validation_1 = require("../validation/cart.validation");
const review_validation_1 = require("../validation/review.validation");
const Upload_1 = __importDefault(require("../middlewares/Upload"));
const router = (0, express_1.Router)();
// Paystack Webhook - PUBLIC endpoint (no authentication required)
router.post('/webhooks/paystack', pressRelease_controller_1.paystackWebhook);
// All routes below require authentication
router.use(Auth_middlewares_1.isAuthenticated);
// Dashboard routes
router.get('/dashboard', pressRelease_controller_1.getDashboardMetrics);
router.get('/stats', pressRelease_controller_1.getPressReleaseStats);
router.get('/list', pressRelease_controller_1.getPressReleasesList);
// Cart routes (these need to be before the generic routes)
router.get('/cart', pressRelease_controller_1.getCart);
router.post('/cart/add', (0, zod_validation_middleware_1.validateRequest)(cart_validation_1.addToCartSchema), pressRelease_controller_1.addToCart);
router.put('/cart/:publisherId', (0, zod_validation_middleware_1.validateRequest)(cart_validation_1.updateCartItemSchema), pressRelease_controller_1.updateCartItem);
router.delete('/cart/:publisherId', (0, zod_validation_middleware_1.validateRequest)(cart_validation_1.removeFromCartSchema), pressRelease_controller_1.removeFromCart);
// Publisher routes (these need to be before the generic routes)
router.get('/publishers', pressRelease_controller_1.getPublishers);
router.post('/publishers', pressRelease_controller_1.createPublisher);
router.get('/publishers/:id', pressRelease_controller_1.getPublisherDetails);
// Order routes (these need to be before the generic routes)
router.post('/orders/checkout', pressRelease_controller_1.createOrder);
router.get('/orders/verify-payment', pressRelease_controller_1.verifyPayment);
router.get('/orders/:id', pressRelease_controller_1.getOrderDetails);
// Press Release CRUD (generic routes should be last)
router.post('/create', Upload_1.default.single('image'), (0, zod_validation_middleware_1.validateRequest)(pressRelease_validation_1.createPressReleaseSchema), pressRelease_controller_1.createPressRelease);
router.get('/:id', pressRelease_controller_1.getPressReleaseDetails);
router.put('/:id', (0, zod_validation_middleware_1.validateRequest)(pressRelease_validation_1.updatePressReleaseSchema), pressRelease_controller_1.updatePressRelease);
router.delete('/:id', pressRelease_controller_1.deletePressRelease);
// Progress Tracker routes
router.get('/tracker/all', pressRelease_controller_1.getPressReleasesWithTracker);
router.get('/tracker/:prId', pressRelease_controller_1.getPressReleaseTracker);
router.put('/tracker/:prId/status', pressRelease_controller_1.updatePressReleaseTrackerStatus);
// Progress Timeline routes
router.get('/progress/all', pressRelease_controller_1.getAllPressReleasesWithProgress);
router.get('/progress/:prId', pressRelease_controller_1.getPressReleaseProgress);
router.put('/progress/:prId/under-review', pressRelease_controller_1.updatePressReleaseToUnderReview);
router.put('/progress/:prId/approve', pressRelease_controller_1.approvePressRelease);
router.put('/progress/:prId/reject', pressRelease_controller_1.rejectPressRelease);
// ==================== MARKETPLACE ROUTES ====================
// Marketplace filters and general data
router.get('/marketplace/filters', pressRelease_controller_1.getMarketplaceFilters);
// Enhanced cart with add-ons
router.post('/cart/add-with-addons', pressRelease_controller_1.addToCartWithAddons);
// Bookmark functionality
router.post('/bookmarks', pressRelease_controller_1.addBookmark);
router.delete('/bookmarks/:publisherId', pressRelease_controller_1.removeBookmark);
router.get('/bookmarks', pressRelease_controller_1.getUserBookmarks);
// Publisher sharing
router.post('/publishers/:publisherId/share', pressRelease_controller_1.sharePublisher);
// Publisher reviews (buyer side)
router.post('/publishers/:publisherId/review', pressRelease_controller_1.submitPublisherReview);
// ==================== REVIEW ROUTES ====================
// Review CRUD for press releases
router.post('/:pressReleaseId/reviews', (0, zod_validation_middleware_1.validateRequest)(review_validation_1.createReviewSchema), review_controller_1.createReview);
router.get('/:pressReleaseId/reviews', (0, zod_validation_middleware_1.validateRequest)(review_validation_1.getReviewsQuerySchema), review_controller_1.getReviews);
router.get('/:pressReleaseId/reviews/summary', review_controller_1.getReviewSummary);
router.put('/reviews/:reviewId', (0, zod_validation_middleware_1.validateRequest)(review_validation_1.updateReviewSchema), review_controller_1.updateReview);
router.delete('/reviews/:reviewId', review_controller_1.deleteReview);
// Admin routes for managing reviews
router.get('/admin/reviews/recent', (0, zod_validation_middleware_1.validateRequest)(review_validation_1.getRecentReviewsQuerySchema), review_controller_1.getRecentReviews);
exports.default = router;
