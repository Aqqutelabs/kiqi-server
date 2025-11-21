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
exports.sendEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
    console.error('[Email] SENDGRID_API_KEY is not set. Email sending is disabled.');
}
// Initialize SendGrid with API key
if (SENDGRID_API_KEY) {
    mail_1.default.setApiKey(SENDGRID_API_KEY);
}
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!SENDGRID_API_KEY) {
        throw new Error('SendGrid client not configured. Set SENDGRID_API_KEY in environment.');
    }
    const fromAddress = options.from || process.env.EMAIL_FROM || 'no-reply@yourapp.com';
    try {
        const msg = {
            to: options.to,
            from: fromAddress,
            subject: options.subject,
            text: options.text || '',
            html: options.html || options.text || '',
        };
        if (options.replyTo) {
            msg.replyTo = options.replyTo;
        }
        yield mail_1.default.send(msg);
        console.log(`[Email][SendGrid] Successfully sent to: ${options.to}`);
    }
    catch (err) {
        // Log detailed SendGrid response for debugging (dev only)
        try {
            const body = ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.body) || ((_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data);
            if (body)
                console.error('[Email][SendGrid] Error response body:', JSON.stringify(body));
        }
        catch (loggingErr) {
            console.error('[Email][SendGrid] Failed to extract error body:', loggingErr);
        }
        console.error('[Email][SendGrid] Error sending email:', err);
        throw err;
    }
});
exports.sendEmail = sendEmail;
