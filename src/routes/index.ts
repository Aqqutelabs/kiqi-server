import { Router } from 'express';
import authRouter from './auth.routes';
import onboardingRouter from './onboarding.routes';
import campaignRoute from './campaign.route';

const router = Router();

// router.use('/auth', authRouter);
router.use('/onboarding', onboardingRouter);
router.use('/campaigns', campaignRoute);

export default router;