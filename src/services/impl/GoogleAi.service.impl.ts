import { AiChat } from "../../models/AiChat";
import { GenerateEmail } from "../../models/GoogleAI";
import { ReGenerateEmail } from "../../models/ReGenerate";
import { GoogleAiService } from "../GoogleAi.service";

export class GoogleAiServiceImpl implements GoogleAiService{
    async generateEmail(prompt: String): Promise<GenerateEmail> {
        throw new Error("Method not implemented.");
    }
    async regenerateEmail(emailId: String, prompt: String): Promise<ReGenerateEmail> {
        throw new Error("Method not implemented.");
    }
    async aiChat(sessionId: String, message: String): Promise<AiChat> {
        throw new Error("Method not implemented.");
    }
}