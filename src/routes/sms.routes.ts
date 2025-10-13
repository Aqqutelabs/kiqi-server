import { Router } from 'express';
import { SmsController } from '../controllers/sms.controller';
import { isAuthenticated } from '../middlewares/Auth.middlewares';

const router = Router();
const controller = new SmsController();

router.post('/sender', isAuthenticated, controller.createSender);
router.get('/senders', isAuthenticated, controller.getSenders);

router.post('/groups', isAuthenticated, controller.createRecipientGroup);
router.get('/groups', isAuthenticated, controller.getRecipientGroups);

router.post('/send', isAuthenticated, controller.sendNow);

export default router;
