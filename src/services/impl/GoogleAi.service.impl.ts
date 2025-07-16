import axios from "axios";
import { AiChat } from "../../models/AiChat";
import { GenerateEmail } from "../../models/GoogleAI";
import { ReGenerateEmail } from "../../models/ReGenerate";
import { GoogleAiService } from "../GoogleAi.service";

const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const API_KEY = process.env.GEMINI_API_KEY!;

export class GoogleAiServiceImpl implements GoogleAiService{
    async generateEmail(prompt: String): Promise<GenerateEmail> {
        try {
            const response = await axios.post(
              `${GOOGLE_API_URL}?key=${API_KEY}`,
              {
                contents: [{ parts: [{ text: prompt }] }],
              }
            );
        
            const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated";
        
            return {
              prompt,
              result: text,
              createdAt: new Date().toISOString(),
            };
        } catch (error: any) {
          console.error("generateEmail error:", error.message);
          throw new Error("Failed to generate email");
        }
    }
    async regenerateEmail(emailId: String, prompt: String): Promise<ReGenerateEmail> {
        try {
            const finalPrompt = `Modify the email with ID ${emailId}. ${prompt}`;
        
            const response = await axios.post(
              `${GOOGLE_API_URL}?key=${API_KEY}`,
              {
                contents: [{ parts: [{ text: finalPrompt }] }],
              }
            );
        
            const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No regenerated content";
        
            return {
              emailId,
              prompt,
              regenerated: text,
              regeneratedAt: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error("regenerateEmail error:", error.message);
            throw new Error("Failed to regenerate email");
          }
    }
    async aiChat(sessionId: String, message: String): Promise<AiChat> {
        try {
            const response = await axios.post(
              `${GOOGLE_API_URL}?key=${API_KEY}`,
              {
                contents: [{ parts: [{ text: message }] }],
              }
            );
        
            const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply";
        
            return {
              sessionId,
              message: message,
              aiResponse: reply,
              timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error("aiChat error:", error.message);
            throw new Error("Chat failed");
          }
    }
}