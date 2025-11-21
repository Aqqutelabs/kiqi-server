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
                // If continueThread is true, fetch the most recent email thread for this user
                let existingEmail = null;
                if (data.continueThread) {
                    existingEmail = yield AIEmail_1.default.findOne({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ updatedAt: -1 }).exec();
                    if (!existingEmail) {
                        // No thread to continue; treat as new email rather than error
                        existingEmail = null;
                    }
                }
                const prompt = this.constructPrompt({ context: data.context, tone: data.tone || 'Professional' }, existingEmail !== null && existingEmail !== void 0 ? existingEmail : undefined);
                const response = yield this.googleAI.generateEmail(prompt);
                // Try to parse the AI response as JSON { subject, body }
                let subject = '';
                let body = '';
                try {
                    const parsed = JSON.parse(String(response.result));
                    subject = parsed.subject || '';
                    body = parsed.body || parsed.content || '';
                }
                catch (e) {
                    // Fallback: try to split by a Subject: line
                    const text = String(response.result || '');
                    const subjMatch = text.match(/Subject:\s*(.*)/i);
                    if (subjMatch) {
                        subject = subjMatch[1].trim();
                        body = text.replace(subjMatch[0], '').trim();
                    }
                    else {
                        // If no subject line, take first line as subject and rest as body
                        const lines = text.split(/\r?\n/).filter(Boolean);
                        if (lines.length > 0) {
                            subject = lines[0].trim();
                            body = lines.slice(1).join('\n').trim();
                        }
                        else {
                            body = text;
                        }
                    }
                }
                const emailPayload = {
                    context: data.context,
                    tone: data.tone || 'Professional',
                    // Store structured content as JSON string for consistency
                    content: JSON.stringify({ subject, body }),
                    userId: new mongoose_1.Types.ObjectId(userId),
                };
                // If continuing a conversation, update the existing email by appending the new content
                if (existingEmail) {
                    // Append continued reply as structured JSON content: merge previous and new
                    try {
                        const prev = JSON.parse(String(existingEmail.content || '{}'));
                        const newContent = { subject: subject || prev.subject || '', body: `${prev.body || ''}\n\n--- Reply continued ---\n\n${body}` };
                        existingEmail.content = JSON.stringify(newContent);
                    }
                    catch (e) {
                        existingEmail.content = `${existingEmail.content}\n\n--- Reply continued ---\n\n${response.result}`;
                    }
                    existingEmail.updatedAt = new Date();
                    yield existingEmail.save();
                    return existingEmail;
                }
                const email = new AIEmail_1.default(emailPayload);
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
    constructPrompt(data, existingEmail) {
        // System instruction: set role and quality expectations
        const system = `You are a professional email copywriter for an email campaign application. Produce clear, well-structured, high-quality email copy suitable for real-world campaigns. Use a professional tone, a concise but descriptive subject line, and a body that reads naturally. Keep length moderate (not verbose), use good grammar, and avoid placeholders like [Your Name].`;
        let prompt = `${system}\n\nContext: ${data.context}\nTone: ${data.tone}\n\nPlease return only the subject and the body. Do not include any recipient lines or metadata.`;
        if (existingEmail) {
            prompt = `${system}\n\nThis is a continuation of the following email thread. Use the original content as context and continue the conversation, keeping the same professional quality.\n\nOriginal email:\n${existingEmail.content}\n\nNew context/instructions: ${data.context}\n\nPlease return only the subject and the body for the continued message.`;
        }
        return prompt;
    }
    constructRegenerationPrompt(email, instructions) {
        return `Revise the following email based on these instructions: "${instructions}"
      
      Original email:
      ${email.content}
      
      Keep the same tone (${email.tone}) and context while applying the requested changes.`;
    }
}
exports.EmailGenerationService = EmailGenerationService;
