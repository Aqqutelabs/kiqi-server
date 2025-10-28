import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiChat, AiChatModel } from "../../models/AiChat";
import { GenerateEmail, GenerateEmailModel } from "../../models/GoogleAI";
import { ReGenerateEmail, ReGenerateModel } from "../../models/ReGenerate";
import { GoogleAiService } from "../GoogleAi.service";

const API_KEY = process.env.GEMINI_API_KEY!;

// Validate API key is present
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export class GoogleAiServiceImpl implements GoogleAiService {
    public async generateEmail(prompt: String): Promise<GenerateEmail> {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            
            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt.toString() }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            });
            
            const response = await result.response;
            const text = response.text() || "No content generated";
            
            const generated = await GenerateEmailModel.create({
                prompt,
                result: text,
                createdAt: new Date().toISOString(),
            });
            return generated;
        } catch (error: any) {
            console.error("Generate email error:", error);
            
            if (error.message?.includes("API key")) {
                throw new Error("Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.");
            }
            
            if (error.message?.includes("quota")) {
                throw new Error("API quota exceeded. Please try again later.");
            }
            
            throw new Error(error.message || "Failed to generate email");
        }
    }

    public async regenerateEmail(emailId: String, prompt: String): Promise<ReGenerateEmail> {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const finalPrompt = `Modify the email with ID ${emailId}. ${prompt}`;
            
            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: finalPrompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            });
            
            const response = await result.response;
            const text = response.text() || "No regenerated content";
            
            const aiResponse = await ReGenerateModel.create({
                emailId,
                prompt,
                regenerated: text,
                regeneratedAt: new Date().toISOString(),
            });
            return aiResponse;
        } catch (error: any) {
            console.error("Regenerate email error:", error);
            
            if (error.message?.includes("API key")) {
                throw new Error("Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.");
            }
            
            if (error.message?.includes("quota")) {
                throw new Error("API quota exceeded. Please try again later.");
            }
            
            throw new Error(error.message || "Failed to regenerate email");
        }
    }

    public async aiChat(sessionId: String, message: String): Promise<AiChat> {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const chat = model.startChat();

            const result = await chat.sendMessage(message.toString());
            const response = await result.response;
            const aiResponse = response.text() || "No reply";
            
            const savedChat = await AiChatModel.create({
                sessionId,
                message,
                aiResponse,
                createdAt: new Date().toISOString(),
            });
            return savedChat;
        } catch (error: any) {
            console.error("AI chat error:", error);
            
            if (error.message?.includes("API key")) {
                throw new Error("Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.");
            }
            
            if (error.message?.includes("quota")) {
                throw new Error("API quota exceeded. Please try again later.");
            }
            
            throw new Error(error.message || "Failed to chat with AI");
        }
    }
}