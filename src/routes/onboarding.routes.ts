import { Router } from 'express';
import { connectWordpress, customizeChatbot } from '../controllers/Onboarding.controller';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { wordpressValidator, chatbotValidator } from '../middlewares/validation.middleware';

const router = Router();

// All onboarding routes should be protected
router.use(verifyJWT);

router.route('/connect-wordpress').post(wordpressValidator, connectWordpress);
router.route('/customize-chatbot').post(chatbotValidator, customizeChatbot);

export default router;