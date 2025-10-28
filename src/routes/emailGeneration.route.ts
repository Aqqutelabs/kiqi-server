import express from 'express';
import { EmailGenerationController } from '../controllers/emailGeneration.controller';
import { GoogleAiServiceImpl } from '../services/impl/GoogleAi.service.impl';
import { EmailGenerationService } from '../services/emailGeneration.service';
import { isAuthenticated } from '../middlewares/Auth.middlewares';

const router = express.Router();

// Initialize services and controller
const googleAIService = new GoogleAiServiceImpl();
const emailGenerationService = new EmailGenerationService(googleAIService);
const emailGenerationController = new EmailGenerationController(emailGenerationService);

// Protected routes - require authentication
router.use(isAuthenticated);

// Email generation routes
router.post('/generate-email', emailGenerationController.generateEmail);
router.post('/regenerate-email', emailGenerationController.regenerateEmail);

export default router;