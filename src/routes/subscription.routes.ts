import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { subscriptionSchema } from '../validation/account.validation';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Subscribe to a plan
router.post('/subscribe', validateRequest(subscriptionSchema.subscribe), subscriptionController.subscribeToPlan);

// Get subscription details with usage
router.get('/details', subscriptionController.getSubscriptionDetails);

// Update subscription
router.put('/update', validateRequest(subscriptionSchema.update), subscriptionController.updateSubscription);

// Cancel subscription
router.post('/cancel', validateRequest(subscriptionSchema.cancel), subscriptionController.cancelSubscription);

// Route to verify payment
router.post('/verify-payment', subscriptionController.verifyPayment);

export default router;