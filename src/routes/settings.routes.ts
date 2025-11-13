import { Router } from 'express';
import { settingsController } from '../controllers/Settings.controller';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { settingsSchema } from '../validation/settings.validation';

const router = Router();

router.get('/', isAuthenticated, settingsController.getSettings);
router.put('/', isAuthenticated, validateRequest(settingsSchema), settingsController.upsertSettings);

export default router;
