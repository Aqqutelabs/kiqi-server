import { Request, NextFunction, Response } from "express";
import { GoogleAiServiceImpl } from "../services/impl/GoogleAi.service.impl";

export class GoogleAiController {
    private googleAiService: GoogleAiServiceImpl;

    constructor() {
        this.googleAiService = new GoogleAiServiceImpl();
    }

    public generateEmail = async (
        req: Request, 
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
          const { prompt } = req.body;
          if (!prompt) res.status(400).json({ error: "Prompt is required" });
    
          const email = await this.googleAiService.generateEmail(prompt);
          res.status(201).json(email);
        } catch (error: any) {
          console.error("Generate Email Error:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }

      public regenerateEmail = async (
        req: Request, 
        res: Response,
        next: NextFunction
    ):  Promise<void> => {
        try {
          const { emailId, prompt } = req.body;
          if (!emailId || !prompt)
             res.status(400).json({ error: "emailId and prompt are required" });
    
          const regenerated = await this.googleAiService.regenerateEmail(emailId, prompt);
           res.status(201).json(regenerated);
        } catch (error: any) {
          console.error("Regenerate Email Error:", error);
           res.status(500).json({ error: "Internal Server Error" });
        }
      }

      public aiChat = async (
        req: Request, 
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
          const { message } = req.body;
          if (!message) {
             res.status(400).json({ error: "message is required" });
             return;
          }

          // Generate a sessionId if not provided (for new chats)
          const sessionId = req.body.sessionId || `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
          const response = await this.googleAiService.aiChat(sessionId, message);
          
          // Return both the response and sessionId so client can use it for follow-up messages
          res.status(201).json({
            ...response,
            sessionId // Include sessionId in response
          });
        } catch (error: any) {
          console.error("AI Chat Error:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    
}