"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const zod_validation_middleware_1 = require("../middlewares/zod.validation.middleware");
const subscription_controller_1 = require("../controllers/subscription.controller");
const transaction_controller_1 = require("../controllers/transaction.controller");
const account_validation_1 = require("../validation/account.validation");
const router = (0, express_1.Router)();
router.use(Auth_middlewares_1.verifyJWT);
// Subscription routes
router.post('/subscribe', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.subscriptionSchema.subscribe), subscription_controller_1.subscriptionController.subscribeToPlan);
router.get('/subscription', subscription_controller_1.subscriptionController.getSubscriptionDetails);
router.put('/subscription', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.subscriptionSchema.update), subscription_controller_1.subscriptionController.updateSubscription);
router.post('/subscription/cancel', (0, zod_validation_middleware_1.validateRequest)(account_validation_1.subscriptionSchema.cancel), subscription_controller_1.subscriptionController.cancelSubscription);
router.get('/transactions', transaction_controller_1.getUserTransactions);
exports.default = router;
