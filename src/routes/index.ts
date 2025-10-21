import { Router } from 'express';
import onboardingRouter from './onboarding.routes';
import campaignRoute from './campaign.route';
import senderRouter from './senderEmail.routes';
import smsRouter from './sms.routes';
import templateRouter from './templates.route';

const router = Router();

router.use('/onboarding', onboardingRouter);
router.use('/campaigns', campaignRoute);
router.use('/senders', senderRouter);
router.use('/sms', smsRouter);
router.use('/sms-templates', templateRouter)

export default router;