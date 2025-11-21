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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailGenerationService = void 0;
const AIEmail_1 = __importDefault(require("../models/AIEmail"));
const ApiError_1 = require("../utils/ApiError");
const mongoose_1 = require("mongoose");
class EmailGenerationService {
    constructor(googleAI) {
        this.googleAI = googleAI;
    }
    generateEmail(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const prompt = this.constructPrompt(data);
                const response = yield this.googleAI.generateEmail(prompt);
                const email = new AIEmail_1.default(Object.assign(Object.assign({}, data), { content: response.result, userId: new mongoose_1.Types.ObjectId(userId) }));
                yield email.save();
                return email;
            }
            catch (error) {
                console.error('Error in generateEmail:', error);
                throw new ApiError_1.ApiError(500, 'Failed to generate email');
            }
        });
    }
    regenerateEmail(userId, emailId, instructions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingEmail = yield AIEmail_1.default.findOne({
                    _id: emailId,
                    userId: new mongoose_1.Types.ObjectId(userId),
                });
                if (!existingEmail) {
                    throw new ApiError_1.ApiError(404, 'Email not found');
                }
                const prompt = this.constructRegenerationPrompt(existingEmail, instructions);
                const response = yield this.googleAI.regenerateEmail(emailId, prompt);
                existingEmail.content = response.regenerated.toString();
                yield existingEmail.save();
                return existingEmail;
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError)
                    throw error;
                throw new ApiError_1.ApiError(500, 'Failed to regenerate email');
            }
        });
    }
    constructPrompt(data) {
        return `Write an email with the following specifications:
      - To: ${data.recipient}
      - Context: ${data.context}
      - Tone: ${data.tone}
      
      The email should be professional and well-structured. Include a clear subject line and proper email formatting.`;
    }
    constructRegenerationPrompt(email, instructions) {
        return `Revise the following email based on these instructions: "${instructions}"
      
      Original email:
      ${email.content}
      
      Keep the same tone (${email.tone}) and context while applying the requested changes.`;
    }
}
exports.EmailGenerationService = EmailGenerationService;
