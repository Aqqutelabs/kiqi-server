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
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;
class GoogleAiServiceImpl {
    generateEmail(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            // Disable Google AI call due to quota exceeded
            return Promise.reject(new Error("Google AI API temporarily disabled due to quota limits."));
            /*
            try {
                const response = await axios.post(
                  `${GOOGLE_API_URL}?key=${API_KEY}`,
                  {
                    contents: [{ parts: [{ text: prompt }] }],
                  }
                );
            
                const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated";
            
                const generated = await GenerateEmailModel.create({
                  prompt,
                  result: text,
                  createdAt: new Date().toISOString(),
                });
                return generated
            } catch (error: any) {
              console.error("generateEmail error:", error.message);
              throw new Error("Failed to generate email");
            }
            */
        });
    }
    regenerateEmail(emailId, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            // Disable Google AI call due to quota exceeded
            return Promise.reject(new Error("Google AI API temporarily disabled due to quota limits."));
            /*
            try {
                const finalPrompt = `Modify the email with ID ${emailId}. ${prompt}`;
            
                const response = await axios.post(
                  `${GOOGLE_API_URL}?key=${API_KEY}`,
                  {
                    contents: [{ parts: [{ text: finalPrompt }] }],
                  }
                );
            
                const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No regenerated content";
            
                const aiResponse = await ReGenerateModel.create({
                  emailId,
                  prompt,
                  regenerated: text,
                  regeneratedAt: new Date().toISOString(),
                });
                return aiResponse;
            } catch (error: any) {
                console.error("regenerateEmail error:", error.message);
                throw new Error("Failed to regenerate email");
              }
            */
        });
    }
    aiChat(sessionId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // Disable Google AI call due to quota exceeded
            return Promise.reject(new Error("Google AI API temporarily disabled due to quota limits."));
            /*
            try {
                  const response = await axios.post(
                    `${GOOGLE_API_URL}?key=${API_KEY}`,
                    {
                      contents: [{ parts: [{ text: message }] }],
                    }
                  );
              
                  const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply";
              
                  const savedChat = await AiChatModel.create({
                    sessionId,
                    message,
                    aiResponse,
                    createdAt: new Date().toISOString(),
                  });
                  return savedChat;
            } catch (error: any) {
                  console.error("aiChat error:", error.message);
                  throw new Error("Failed to chat with AI");
            }
            */
        });
    }
}
exports.GoogleAiServiceImpl = GoogleAiServiceImpl;
