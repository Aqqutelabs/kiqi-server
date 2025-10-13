import { Router } from 'express';
import onboardingRouter from './onboarding.routes';
import campaignRoute from './campaign.route';
import senderRouter from './senderEmail.routes';
import smsRouter from './sms.routes';

const router = Router();

router.use('/onboarding', onboardingRouter);
router.use('/campaigns', campaignRoute);
router.use('/senders', senderRouter);
router.use('/sms', smsRouter);

export default router;