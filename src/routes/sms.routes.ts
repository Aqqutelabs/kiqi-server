
import { Router } from 'express';
import { SmsController } from '../controllers/sms.controller';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import upload from '../middlewares/uploadCsv';

const router = Router();
const controller = new SmsController();

router.post('/sender', isAuthenticated, controller.createSender);
router.get('/senders', isAuthenticated, controller.getSenders);
router.put('/sender/:id', isAuthenticated, controller.updateSender);
router.delete('/sender/:id', isAuthenticated, controller.deleteSender);
router.post('/send', isAuthenticated, controller.sendMessage);
router.post('/templates', isAuthenticated, controller.createTemplate);
router.get('/templates', isAuthenticated, controller.getTemplates);
router.get('/templates/:id', isAuthenticated, controller.getTemplateById);
router.put('/templates/:id', isAuthenticated, controller.updateTemplate);
router.delete('/templates/:id', isAuthenticated, controller.deleteTemplate);
router.post('/templates/:id/send', isAuthenticated, controller.sendTemplate);

router.post('/groups', isAuthenticated, (req, res, next) => {
	upload.single('csv')(req, res, (err) => {
		if (err && err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'file') {
			upload.single('file')(req, res, next);
		} else if (err) {
			next(err);
		} else {
			next();
		}
	});
}, controller.createRecipientGroup);
router.get('/groups', isAuthenticated, controller.getRecipientGroups);
router.put('/groups/:id', isAuthenticated, controller.updateRecipientGroup);
router.delete('/groups/:id', isAuthenticated, controller.deleteRecipientGroup);

router.post('/send', isAuthenticated, controller.sendNow);

export default router;
