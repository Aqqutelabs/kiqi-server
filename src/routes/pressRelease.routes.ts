import { Router } from 'express';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import { 
    getDashboardMetrics,
    getPressReleaseStats,
    getPressReleaseDetails,
    createPressRelease,
    getPressReleasesList,
    updatePressRelease,
    deletePressRelease,
    getPublishers,
    getPublisherDetails,
    createOrder,
    getOrderDetails,
    verifyPayment,
    paystackWebhook,
    createPublisher,
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    getPressReleaseTracker,
    updatePressReleaseTrackerStatus,
    getPressReleasesWithTracker,
    getPressReleaseProgress,
    updatePressReleaseToUnderReview,
    approvePressRelease,
    rejectPressRelease,
    getAllPressReleasesWithProgress,
    // New marketplace functions
    addToCartWithAddons,
    addBookmark,
    removeBookmark,
    getUserBookmarks,
    sharePublisher,
    submitPublisherReview,
    getPublisherReviews,
    getMarketplaceFilters
} from '../controllers/pressRelease.controller';

import {
    createReview,
    getReviews,
    getReviewSummary,
    updateReview,
    deleteReview,
    getRecentReviews
} from '../controllers/review.controller';

import { 
    createPressReleaseSchema,
    updatePressReleaseSchema,
    createOrderSchema,
    createPublisherSchema 
} from '../validation/pressRelease.validation';

import {
    addToCartSchema,
    updateCartItemSchema,
    removeFromCartSchema
} from '../validation/cart.validation';

import {
    createReviewSchema,
    updateReviewSchema,
    getReviewsQuerySchema,
    getRecentReviewsQuerySchema
} from '../validation/review.validation';

import upload from '../middlewares/Upload';

const router = Router();

// Paystack Webhook - PUBLIC endpoint (no authentication required)
router.post('/webhooks/paystack', paystackWebhook);

// All routes below require authentication
router.use(isAuthenticated);

// Dashboard routes
router.get('/dashboard', getDashboardMetrics);
router.get('/stats', getPressReleaseStats);
router.get('/list', getPressReleasesList);

// Cart routes (these need to be before the generic routes)
router.get('/cart', getCart);
router.post('/cart/add', validateRequest(addToCartSchema), addToCart);
router.put('/cart/:publisherId', validateRequest(updateCartItemSchema), updateCartItem);
router.delete('/cart/:publisherId', validateRequest(removeFromCartSchema), removeFromCart);

// Publisher routes (these need to be before the generic routes)
router.get('/publishers', getPublishers);
router.post('/publishers', createPublisher);
router.get('/publishers/:id', getPublisherDetails);

// Order routes (these need to be before the generic routes)
router.post('/orders/checkout', createOrder);
router.get('/orders/verify-payment', verifyPayment);
router.get('/orders/:id', getOrderDetails);

// Press Release CRUD (generic routes should be last)
router.post('/create', upload.single('image'), validateRequest(createPressReleaseSchema), createPressRelease);
router.get('/:id', getPressReleaseDetails);
router.put('/:id', validateRequest(updatePressReleaseSchema), updatePressRelease);
router.delete('/:id', deletePressRelease);

// Progress Tracker routes
router.get('/tracker/all', getPressReleasesWithTracker);
router.get('/tracker/:prId', getPressReleaseTracker);
router.put('/tracker/:prId/status', updatePressReleaseTrackerStatus);

// Progress Timeline routes
router.get('/progress/all', getAllPressReleasesWithProgress);
router.get('/progress/:prId', getPressReleaseProgress);
router.put('/progress/:prId/under-review', updatePressReleaseToUnderReview);
router.put('/progress/:prId/approve', approvePressRelease);
router.put('/progress/:prId/reject', rejectPressRelease);

// ==================== MARKETPLACE ROUTES ====================

// Marketplace filters and general data
router.get('/marketplace/filters', getMarketplaceFilters);

// Enhanced cart with add-ons
router.post('/cart/add-with-addons', addToCartWithAddons);

// Bookmark functionality
router.post('/bookmarks', addBookmark);
router.delete('/bookmarks/:publisherId', removeBookmark);
router.get('/bookmarks', getUserBookmarks);

// Publisher sharing
router.post('/publishers/:publisherId/share', sharePublisher);

// Publisher reviews (buyer side)
router.post('/publishers/:publisherId/review', submitPublisherReview);
router.get('/publishers/:publisherId/reviews', getPublisherReviews);

// ==================== REVIEW ROUTES ====================

// Review CRUD for press releases
router.post('/:pressReleaseId/reviews', validateRequest(createReviewSchema), createReview);
router.get('/:pressReleaseId/reviews', validateRequest(getReviewsQuerySchema), getReviews);
router.get('/:pressReleaseId/reviews/summary', getReviewSummary);
router.put('/reviews/:reviewId', validateRequest(updateReviewSchema), updateReview);
router.delete('/reviews/:reviewId', deleteReview);

// Admin routes for managing reviews
router.get('/admin/reviews/recent', validateRequest(getRecentReviewsQuerySchema), getRecentReviews);

export default router;