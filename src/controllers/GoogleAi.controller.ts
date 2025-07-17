import { NextFunction, Request, Response } from "express";
import { GoogleAiServiceImpl } from "../services/impl/GoogleAi.service.impl";

export class GoogleAi {
    private googleAiService: GoogleAiServiceImpl;

    constructor() {
        this.googleAiService = new GoogleAiServiceImpl();
    }

    public async generateEmail (
        req: Request, 
        res: Response,
        next: NextFunction
    ) {
        try {
          const { prompt } = req.body;
          if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    
          const email = await this.googleAiService.generateEmail(prompt);
          return res.status(201).json(email);
        } catch (error: any) {
          console.error("Generate Email Error:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }

      public async regenerateEmail(
        req: Request, 
        res: Response,
        next: NextFunction
    ) {
        try {
          const { emailId, prompt } = req.body;
          if (!emailId || !prompt)
            return res.status(400).json({ error: "emailId and prompt are required" });
    
          const regenerated = await this.googleAiService.regenerateEmail(emailId, prompt);
          return res.status(201).json(regenerated);
        } catch (error: any) {
          console.error("Regenerate Email Error:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }

      public async aiChat(req: Request, res: Response) {
        try {
          const { sessionId, message } = req.body;
          if (!sessionId || !message)
            return res.status(400).json({ error: "sessionId and message are required" });
    
          const response = await this.googleAiService.aiChat(sessionId, message);
          return res.status(201).json(response);
        } catch (error: any) {
          console.error("AI Chat Error:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }
    
}