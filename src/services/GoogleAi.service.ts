import { AiChat } from "../models/AiChat";
import { GenerateEmail } from "../models/GoogleAI";
import { ReGenerateEmail } from "../models/ReGenerate";

export interface GoogleAiService{
    generateEmail( prompt: String ): Promise<GenerateEmail>
    regenerateEmail( emailId: String, prompt: String ): Promise<ReGenerateEmail>
    aiChat( sessionId: String, message: String ): Promise<AiChat>
}