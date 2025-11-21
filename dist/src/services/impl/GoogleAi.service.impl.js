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
exports.GoogleAiServiceImpl = void 0;
// Assuming you have installed the correct package: npm install @google/genai
const genai_1 = require("@google/genai");
const AiChat_1 = require("../../models/AiChat");
const GoogleAI_1 = require("../../models/GoogleAI");
const ReGenerate_1 = require("../../models/ReGenerate");
// --- Configuration and Initialization ---
const API_KEY = process.env.GEMINI_API_KEY;
// Validate API key is present
if (!API_KEY) {
    // Better to throw a regular Error here, as the class should not be instantiable without the key.
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}
// Initialize the GoogleGenAI client
const ai = new genai_1.GoogleGenAI({ apiKey: API_KEY });
const CHAT_MODEL = "gemini-2.5-flash"; // A fast and capable model for general tasks
// --- Service Implementation ---
class GoogleAiServiceImpl {
    /**
     * Generates an email based on a user prompt.
     * @param prompt The prompt to generate the email from.
     * @returns The saved GenerateEmail model instance.
     */
    generateEmail(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use the recommended generateContent structure with the contents array
                const response = yield ai.models.generateContent({
                    model: CHAT_MODEL,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                });
                // Extract the generated text safely
                const text = response.text || "No content generated";
                // Save to database/model
                const generated = yield GoogleAI_1.GenerateEmailModel.create({
                    prompt,
                    result: text,
                    createdAt: new Date().toISOString(),
                });
                return generated;
            }
            catch (error) {
                console.error("Generate email error:", error);
                if ((error === null || error === void 0 ? void 0 : error.name) === 'RateLimitError' || (error === null || error === void 0 ? void 0 : error.code) === 'rateLimit' || (error === null || error === void 0 ? void 0 : error.status) === 429) {
                    // The error object might not always contain retryAfter, so handle the message
                    const details = (error === null || error === void 0 ? void 0 : error.message) || '';
                    throw new Error(`API rate limit exceeded. Please try again later. Details: ${details}`);
                }
                // Re-throw the original error or a custom one if it's an unhandled API issue
                throw new Error(error.message || "Failed to generate email due to an unknown API error.");
            }
        });
    }
    // ---
    /**
     * Regenerates/modifies an existing email based on a new prompt.
     * @param emailId The ID of the email to modify (used for logging/prompt context).
     * @param prompt The new instructions for modification.
     * @returns The saved ReGenerateEmail model instance.
     */
    regenerateEmail(emailId, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Include the email ID in the final prompt (assuming the prompt already contains the original email text,
                // or the model has context/instructions to look it up, which is a common pattern in a real app).
                const finalPrompt = `Modify the email with ID ${emailId} based on the following instructions: "${prompt}"`;
                const response = yield ai.models.generateContent({
                    model: CHAT_MODEL,
                    contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
                });
                const text = response.text || "No regenerated content";
                // Save to database/model
                const aiResponse = yield ReGenerate_1.ReGenerateModel.create({
                    emailId,
                    prompt,
                    regenerated: text,
                    regeneratedAt: new Date().toISOString(),
                });
                return aiResponse;
            }
            catch (error) {
                console.error("regenerateEmail error:", error);
                if ((error === null || error === void 0 ? void 0 : error.name) === 'RateLimitError' || (error === null || error === void 0 ? void 0 : error.code) === 'rateLimit' || (error === null || error === void 0 ? void 0 : error.status) === 429) {
                    // Safely access retryAfter, defaulting to a general message if unavailable
                    const retryAfter = error === null || error === void 0 ? void 0 : error.retryAfter;
                    const retryMessage = retryAfter ?
                        `Please try again in ${Math.ceil(retryAfter / 1000)} seconds.` :
                        "Please try again in a moment.";
                    throw new Error(`API rate limit exceeded. ${retryMessage}`);
                }
                throw new Error(error.message || "Failed to regenerate email.");
            }
        });
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
    aiChat(sessionId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use the SDK's generateContent method for a simple single-turn chat interaction.
                // The previous implementation used an incorrect custom axios call.
                const response = yield ai.models.generateContent({
                    model: CHAT_MODEL,
                    contents: [{ role: "user", parts: [{ text: message }] }],
                });
                const aiResponse = response.text || "No reply";
                // Save to database/model
                const savedChat = yield AiChat_1.AiChatModel.create({
                    sessionId,
                    message,
                    aiResponse,
                    createdAt: new Date().toISOString(),
                });
                return savedChat;
            }
            catch (error) {
                console.error("aiChat error:", error);
                if ((error === null || error === void 0 ? void 0 : error.name) === 'RateLimitError' || (error === null || error === void 0 ? void 0 : error.code) === 'rateLimit' || (error === null || error === void 0 ? void 0 : error.status) === 429) {
                    const retryAfter = error === null || error === void 0 ? void 0 : error.retryAfter;
                    const retryMessage = retryAfter ?
                        `Please try again in ${Math.ceil(retryAfter / 1000)} seconds.` :
                        "Please try again in a moment.";
                    throw new Error(`API rate limit exceeded. ${retryMessage}`);
                }
                throw new Error(error.message || "Failed to chat with AI.");
            }
        });
    }
}
exports.GoogleAiServiceImpl = GoogleAiServiceImpl;
