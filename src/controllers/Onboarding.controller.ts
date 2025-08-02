// import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import { onboardingService } from '../services/Onboarding';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
// import { AuthRequest } from '../middlewares/auth.middleware';
// import { onboardingService } from '../services/onboarding.service';

export const connectWordpress = asyncHandler(async (req: AuthRequest, res) => {
    const { publicUrl, username, password } = req.body;
    const userId = req.user!.id; // From verifyJWT middleware

    // In a real application, you would associate this with the user's organization.
    // We'll just save it for now.
    const connectionData = {
        userId,
        publicUrl,
        username,
        password, // IMPORTANT: This should be encrypted before saving!
    };
    
    const savedConnection = await onboardingService.saveWordpressConnection(connectionData);

    res.status(200).json(new ApiResponse(200, savedConnection, "WordPress site connected successfully."));
});

export const customizeChatbot = asyncHandler(async (req: AuthRequest, res) => {
    const { name, theme, welcomeMessage, widgetPosition, tone } = req.body;
    const userId = req.user!.id;
    
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

    const savedSettings = await onboardingService.saveChatbotSettings(chatbotData);
    
    res.status(200).json(new ApiResponse(200, savedSettings, "Chatbot customized successfully."));
});