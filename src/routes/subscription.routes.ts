import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { verifyJWT } from '../middlewares/Auth.middlewares';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create new subscription
router.post('/', subscriptionController.createSubscription);

// Get active subscription
router.get('/active', subscriptionController.getActiveSubscription);

// Get subscription history
router.get('/history', subscriptionController.getSubscriptionHistory);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Update subscription
router.put('/update', subscriptionController.updateSubscription);

export default router;