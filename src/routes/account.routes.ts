import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { subscriptionController } from '../controllers/subscription.controller';
import { subscriptionSchema, updateSubscriptionSchema } from '../validation/account.validation';

const router = Router();
router.use(verifyJWT);

router
    .route('/')
    .post(validateRequest(subscriptionSchema), subscriptionController.createSubscription)
    .get(subscriptionController.getActiveSubscription);

router.get('/history', subscriptionController.getSubscriptionHistory);
router.post('/cancel', subscriptionController.cancelSubscription);
router.put('/update', validateRequest(updateSubscriptionSchema), subscriptionController.updateSubscription);

export default router;