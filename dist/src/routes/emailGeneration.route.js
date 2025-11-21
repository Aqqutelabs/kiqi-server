"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emailGeneration_controller_1 = require("../controllers/emailGeneration.controller");
const GoogleAi_service_impl_1 = require("../services/impl/GoogleAi.service.impl");
const emailGeneration_service_1 = require("../services/emailGeneration.service");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const router = express_1.default.Router();
// Initialize services and controller
const googleAIService = new GoogleAi_service_impl_1.GoogleAiServiceImpl();
const emailGenerationService = new emailGeneration_service_1.EmailGenerationService(googleAIService);
const emailGenerationController = new emailGeneration_controller_1.EmailGenerationController(emailGenerationService);
// Protected routes - require authentication
router.use(Auth_middlewares_1.isAuthenticated);
// Email generation routes
router.post('/generate-email', emailGenerationController.generateEmail);
router.post('/regenerate-email', emailGenerationController.regenerateEmail);
exports.default = router;
