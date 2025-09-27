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
exports.GoogleAiController = void 0;
const GoogleAi_service_impl_1 = require("../services/impl/GoogleAi.service.impl");
class GoogleAiController {
    constructor() {
        this.generateEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { prompt } = req.body;
                if (!prompt)
                    res.status(400).json({ error: "Prompt is required" });
                const email = yield this.googleAiService.generateEmail(prompt);
                res.status(201).json(email);
            }
            catch (error) {
                console.error("Generate Email Error:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
        this.regenerateEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { emailId, prompt } = req.body;
                if (!emailId || !prompt)
                    res.status(400).json({ error: "emailId and prompt are required" });
                const regenerated = yield this.googleAiService.regenerateEmail(emailId, prompt);
                res.status(201).json(regenerated);
            }
            catch (error) {
                console.error("Regenerate Email Error:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
        this.aiChat = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId, message } = req.body;
                if (!sessionId || !message)
                    res.status(400).json({ error: "sessionId and message are required" });
                const response = yield this.googleAiService.aiChat(sessionId, message);
                res.status(201).json(response);
            }
            catch (error) {
                console.error("AI Chat Error:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
        this.googleAiService = new GoogleAi_service_impl_1.GoogleAiServiceImpl();
    }
}
exports.GoogleAiController = GoogleAiController;
