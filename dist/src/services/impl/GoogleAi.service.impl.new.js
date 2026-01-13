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
const generative_ai_1 = require("@google/generative-ai");
const AiChat_1 = require("../../models/AiChat");
const GoogleAI_1 = require("../../models/GoogleAI");
const ReGenerate_1 = require("../../models/ReGenerate");
const API_KEY = process.env.GEMINI_API_KEY;
// Validate API key is present
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
class GoogleAiServiceImpl {
    generateEmail(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = yield model.generateContent({
                    contents: [{
                            role: "user",
                            parts: [{ text: prompt.toString() }]
                        }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                });
                const response = yield result.response;
                const text = response.text() || "No content generated";
                const generated = yield GoogleAI_1.GenerateEmailModel.create({
                    prompt,
                    result: text,
                    createdAt: new Date().toISOString(),
                });
                return generated;
            }
            catch (error) {
                console.error("Generate email error:", error);
                if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("API key")) {
                    throw new Error("Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.");
                }
                if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("quota")) {
                    throw new Error("API quota exceeded. Please try again later.");
                }
                throw new Error(error.message || "Failed to generate email");
            }
        });
    }
    regenerateEmail(emailId, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const finalPrompt = `Modify the email with ID ${emailId}. ${prompt}`;
                const result = yield model.generateContent({
                    contents: [{
                            role: "user",
                            parts: [{ text: finalPrompt }]
                        }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                });
                const response = yield result.response;
                const text = response.text() || "No regenerated content";
                const aiResponse = yield ReGenerate_1.ReGenerateModel.create({
                    emailId,
                    prompt,
                    regenerated: text,
                    regeneratedAt: new Date().toISOString(),
                });
                return aiResponse;
            }
            catch (error) {
                console.error("Regenerate email error:", error);
                if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("API key")) {
                    throw new Error("Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.");
                }
                if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("quota")) {
                    throw new Error("API quota exceeded. Please try again later.");
                }
                throw new Error(error.message || "Failed to regenerate email");
            }
        });
    }
    aiChat(sessionId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const chat = model.startChat();
                const result = yield chat.sendMessage(message.toString());
                const response = yield result.response;
                const aiResponse = response.text() || "No reply";
                const savedChat = yield AiChat_1.AiChatModel.create({
                    sessionId,
                    message,
                    aiResponse,
                    createdAt: new Date().toISOString(),
                });
                return savedChat;
            }
            catch (error) {
                console.error("AI chat error:", error);
                if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("API key")) {
                    throw new Error("Invalid or missing API key. Please check your GEMINI_API_KEY environment variable.");
                }
                if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("quota")) {
                    throw new Error("API quota exceeded. Please try again later.");
                }
                throw new Error(error.message || "Failed to chat with AI");
            }
        });
    }
}
exports.GoogleAiServiceImpl = GoogleAiServiceImpl;
