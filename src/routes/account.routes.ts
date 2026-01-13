import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { subscriptionController } from '../controllers/subscription.controller';
import { getUserTransactions } from '../controllers/transaction.controller';
import { subscriptionSchema } from '../validation/account.validation';

const router = Router();
router.use(verifyJWT);

// Subscription routes
router.post('/subscribe', validateRequest(subscriptionSchema.subscribe), subscriptionController.subscribeToPlan);
router.get('/subscription', subscriptionController.getSubscriptionDetails);
router.put('/subscription', validateRequest(subscriptionSchema.update), subscriptionController.updateSubscription);
router.post('/subscription/cancel', validateRequest(subscriptionSchema.cancel), subscriptionController.cancelSubscription);
router.get('/transactions', getUserTransactions);

export default router;