import { Router } from 'express';
import { SmsController } from '../controllers/sms.controller';
import { isAuthenticated } from '../middlewares/Auth.middlewares';

const router = Router();
const controller = new SmsController();

router.post('/', isAuthenticated, controller.createDraft);
router.get('/', isAuthenticated, controller.getDrafts);
router.get('/:id', isAuthenticated, controller.getDraftById);
router.patch('/:id', isAuthenticated, controller.updateDraft);
router.delete('/:id', isAuthenticated, controller.deleteDraft);
router.post('/:id/send', isAuthenticated, controller.sendDraft);

export default router;
