"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customizeChatbot = exports.connectWordpress = void 0;
const Onboarding_1 = require("../services/Onboarding");
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
// import { AuthRequest } from '../middlewares/auth.middleware';
// import { onboardingService } from '../services/onboarding.service';
exports.connectWordpress = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicUrl, username, password } = req.body;
    const userId = req.user.id; // From verifyJWT middleware
    // In a real application, you would associate this with the user's organization.
    // We'll just save it for now.
    const connectionData = {
        userId,
        publicUrl,
        username,
        password, // IMPORTANT: This should be encrypted before saving!
    };
    const savedConnection = yield Onboarding_1.onboardingService.saveWordpressConnection(connectionData);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, savedConnection, "WordPress site connected successfully."));
}));
exports.customizeChatbot = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, theme, welcomeMessage, widgetPosition, tone } = req.body;
    const userId = req.user.id;
    // The avatar would be handled via a file upload middleware (like multer).
    // The middleware would place the file URL in req.file.path.
    // const avatarUrl = req.file?.path;
    const avatarUrl = req.body.avatarUrl || 'default-avatar.png'; // Using placeholder
    const chatbotData = {
        userId,
        name,
        avatarUrl,
        theme,
        welcomeMessage,
        widgetPosition,
        tone,
    };
    const savedSettings = yield Onboarding_1.onboardingService.saveChatbotSettings(chatbotData);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, savedSettings, "Chatbot customized successfully."));
}));
