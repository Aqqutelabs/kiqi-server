"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const account_validation_1 = require("../validation/account.validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(Auth_middlewares_1.verifyJWT);
// Subscribe to a plan
router.post('/subscribe', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.subscriptionSchema.subscribe), subscription_controller_1.subscriptionController.subscribeToPlan);
// Get subscription details with usage
router.get('/details', subscription_controller_1.subscriptionController.getSubscriptionDetails);
// Update subscription
router.put('/update', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.subscriptionSchema.update), subscription_controller_1.subscriptionController.updateSubscription);
// Cancel subscription
router.post('/cancel', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.subscriptionSchema.cancel), subscription_controller_1.subscriptionController.cancelSubscription);
// Route to verify payment
router.post('/verify-payment', subscription_controller_1.subscriptionController.verifyPayment);
exports.default = router;
