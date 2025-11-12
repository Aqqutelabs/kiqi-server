import { Router } from 'express';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import { 
    getDashboardMetrics,
    getPressReleaseDetails,
    createPressRelease,
    getPressReleasesList,
    updatePressRelease,
    deletePressRelease,
    getPublishers,
    getPublisherDetails,
    createOrder,
    getOrderDetails,
    createPublisher,
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem
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

// All routes require authentication
router.use(isAuthenticated);

// Dashboard routes
router.get('/dashboard', getDashboardMetrics);
router.get('/list', getPressReleasesList);

// Cart routes (these need to be before the generic routes)
router.get('/cart', getCart);
router.post('/cart/add', validateRequest(addToCartSchema), addToCart);
router.put('/cart/:publisherId', validateRequest(updateCartItemSchema), updateCartItem);
router.delete('/cart/:publisherId', validateRequest(removeFromCartSchema), removeFromCart);

// Publisher routes (these need to be before the generic routes)
router.get('/publishers', getPublishers);
router.get('/publishers/:id', getPublisherDetails);
router.post('/publishers', createPublisher);

// Order routes (these need to be before the generic routes)
router.post('/orders/checkout', createOrder);
router.get('/orders/:id', getOrderDetails);

// Press Release CRUD (generic routes should be last)
router.post('/create', upload.single('image'), validateRequest(createPressReleaseSchema), createPressRelease);
router.get('/:id', getPressReleaseDetails);
router.put('/:id', validateRequest(updatePressReleaseSchema), updatePressRelease);
router.delete('/:id', deletePressRelease);

export default router;