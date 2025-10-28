// Assuming you have installed the correct package: npm install @google/genai
import { GoogleGenAI } from "@google/genai";
import { AiChat, AiChatModel } from "../../models/AiChat";
import { GenerateEmail, GenerateEmailModel } from "../../models/GoogleAI";
import { ReGenerateEmail, ReGenerateModel } from "../../models/ReGenerate";
import { GoogleAiService } from "../GoogleAi.service";

// --- Configuration and Initialization ---

const API_KEY: string = process.env.GEMINI_API_KEY!;

// Validate API key is present
if (!API_KEY) {
    // Better to throw a regular Error here, as the class should not be instantiable without the key.
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: API_KEY });
const CHAT_MODEL = "gemini-2.5-flash"; // A fast and capable model for general tasks

// --- Service Implementation ---

export class GoogleAiServiceImpl implements GoogleAiService {
    
    /**
     * Generates an email based on a user prompt.
     * @param prompt The prompt to generate the email from.
     * @returns The saved GenerateEmail model instance.
     */
    public async generateEmail(prompt: string): Promise<GenerateEmail> {
        try {
            // Use the recommended generateContent structure with the contents array
            const response = await ai.models.generateContent({
                model: CHAT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            // Extract the generated text safely
            const text = response.text || "No content generated";
        
            // Save to database/model
            const generated = await GenerateEmailModel.create({
                prompt,
                result: text,
                createdAt: new Date().toISOString(),
            });

            return generated;
        } catch (error: any) {
            console.error("Generate email error:", error);

            if ((error as any)?.name === 'RateLimitError' || (error as any)?.code === 'rateLimit' || (error as any)?.status === 429) {
                // The error object might not always contain retryAfter, so handle the message
                const details = (error as any)?.message || '';
                throw new Error(`API rate limit exceeded. Please try again later. Details: ${details}`);
            }
            
            // Re-throw the original error or a custom one if it's an unhandled API issue
            throw new Error(error.message || "Failed to generate email due to an unknown API error.");
        }
    }

    // ---
    
    /**
     * Regenerates/modifies an existing email based on a new prompt.
     * @param emailId The ID of the email to modify (used for logging/prompt context).
     * @param prompt The new instructions for modification.
     * @returns The saved ReGenerateEmail model instance.
     */
    public async regenerateEmail(emailId: string, prompt: string): Promise<ReGenerateEmail> {
        try {
            // Include the email ID in the final prompt (assuming the prompt already contains the original email text,
            // or the model has context/instructions to look it up, which is a common pattern in a real app).
            const finalPrompt = `Modify the email with ID ${emailId} based on the following instructions: "${prompt}"`;
            
            const response = await ai.models.generateContent({
                model: CHAT_MODEL,
                contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            });
            
            const text = response.text || "No regenerated content";
        
            // Save to database/model
            const aiResponse = await ReGenerateModel.create({
              emailId,
              prompt,
              regenerated: text,
              regeneratedAt: new Date().toISOString(),
            });

            return aiResponse;
        } catch (error: any) {
            console.error("regenerateEmail error:", error);

            if ((error as any)?.name === 'RateLimitError' || (error as any)?.code === 'rateLimit' || (error as any)?.status === 429) {
                // Safely access retryAfter, defaulting to a general message if unavailable
                const retryAfter = (error as any)?.retryAfter;
                const retryMessage = retryAfter ? 
                    `Please try again in ${Math.ceil(retryAfter / 1000)} seconds.` : 
                    "Please try again in a moment.";
                throw new Error(`API rate limit exceeded. ${retryMessage}`);
            }

            throw new Error(error.message || "Failed to regenerate email.");
        }
    }

    // ---
    
    /**
     * Handles a single-turn chat with a session ID for logging.
     * NOTE: For multi-turn conversational chat, you would use `ai.chats.create(...)`
     * and maintain history. This implementation provides a simple single-turn response.
     * @param sessionId The ID for the chat session.
     * @param message The user's message.
     * @returns The saved AiChat model instance.
     */
    public async aiChat(sessionId: string, message: string): Promise<AiChat> {
        try {
            // Use the SDK's generateContent method for a simple single-turn chat interaction.
            // The previous implementation used an incorrect custom axios call.
            const response = await ai.models.generateContent({
                model: CHAT_MODEL,
                contents: [{ role: "user", parts: [{ text: message }] }],
            });
        
            const aiResponse = response.text || "No reply";
        
            // Save to database/model
            const savedChat = await AiChatModel.create({
                sessionId,
                message,
                aiResponse,
                createdAt: new Date().toISOString(),
            });
            
            return savedChat;
        } catch (error: any) {
            console.error("aiChat error:", error);

            if ((error as any)?.name === 'RateLimitError' || (error as any)?.code === 'rateLimit' || (error as any)?.status === 429) {
                const retryAfter = (error as any)?.retryAfter;
                const retryMessage = retryAfter ? 
                    `Please try again in ${Math.ceil(retryAfter / 1000)} seconds.` : 
                    "Please try again in a moment.";
                throw new Error(`API rate limit exceeded. ${retryMessage}`);
            }

            throw new Error(error.message || "Failed to chat with AI.");
        }
    }
}