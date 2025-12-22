"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const pressRelease_controller_1 = require("../controllers/pressRelease.controller");
const pressRelease_validation_1 = require("../validation/pressRelease.validation");
const cart_validation_1 = require("../validation/cart.validation");
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
router.get('/publishers/:id', pressRelease_controller_1.getPublisherDetails);
router.post('/publishers', pressRelease_controller_1.createPublisher);
// Order routes (these need to be before the generic routes)
router.post('/orders/checkout', pressRelease_controller_1.createOrder);
router.get('/orders/verify-payment', pressRelease_controller_1.verifyPayment);
router.get('/orders/:id', pressRelease_controller_1.getOrderDetails);
// Press Release CRUD (generic routes should be last)
router.post('/create', Upload_1.default.single('image'), (0, zod_validation_middleware_1.validateRequest)(pressRelease_validation_1.createPressReleaseSchema), pressRelease_controller_1.createPressRelease);
router.get('/:id', pressRelease_controller_1.getPressReleaseDetails);
router.put('/:id', (0, zod_validation_middleware_1.validateRequest)(pressRelease_validation_1.updatePressReleaseSchema), pressRelease_controller_1.updatePressRelease);
router.delete('/:id', pressRelease_controller_1.deletePressRelease);
exports.default = router;
