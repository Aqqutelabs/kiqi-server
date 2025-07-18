import { Router } from "express";
import { GoogleAiController } from "../controllers/GoogleAi.controller";
import { isAuthenticated } from "../middlewares/Auth.middlewares";

const googleAIrouter = Router();
const AIController = new GoogleAiController();

googleAIrouter.post("/generate-email", isAuthenticated, AIController.generateEmail);
googleAIrouter.post("/regenerate-email", isAuthenticated, AIController.regenerateEmail);
googleAIrouter.post("/ai-chat", isAuthenticated, AIController.aiChat);



export default googleAIrouter;