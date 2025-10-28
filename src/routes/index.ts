import { Router } from 'express';
import onboardingRouter from './onboarding.routes';
import campaignRoute from './campaign.route';
import senderRouter from './senderEmail.routes';
import smsRouter from './sms.routes';
import templateRouter from './templates.route';
import draftsRouter from './drafts.routes';
import emailGenerationRouter from './emailGeneration.route';
import pressReleaseRouter from './pressRelease.routes';

const router = Router();

router.use('/onboarding', onboardingRouter);
router.use('/campaigns', campaignRoute);
router.use('/senders', senderRouter);
router.use('/sms', smsRouter);
router.use('/sms-templates', templateRouter);
router.use('/drafts', draftsRouter);
router.use('/ai-email', emailGenerationRouter);
router.use('/press-releases', pressReleaseRouter);

export default router;