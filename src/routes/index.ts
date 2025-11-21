import { Router } from 'express';
import onboardingRouter from './onboarding.routes';
import campaignRoute from './campaign.route';
import senderRouter from './senderEmail.routes';
import smsRouter from './sms.routes';
import templateRouter from './templates.route';
import draftsRouter from './drafts.routes';
import emailGenerationRouter from './emailGeneration.route';
import pressReleaseRouter from './pressRelease.routes';
import accountRouter from './account.routes';
import subscriptionRouter from './subscription.routes';
import walletRouter from './wallet.routes';
import cardRouter from './card.routes';
import settingsRouter from './settings.routes';

const router = Router();



router.use('/onboarding', onboardingRouter);
router.use('/campaigns', campaignRoute);
// router.use('/senders', senderRouter);
router.use('/sms', smsRouter);
router.use('/sms-templates', templateRouter);
router.use('/drafts', draftsRouter);
router.use('/ai-email', emailGenerationRouter);
router.use('/press-releases', pressReleaseRouter);
router.use('/account', accountRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/wallets', walletRouter);
router.use('/cards', cardRouter);
router.use('/settings', settingsRouter);

export default router;