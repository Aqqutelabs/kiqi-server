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
    getMarketplaceFilters
} from '../controllers/pressRelease.controller';

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

export default router;