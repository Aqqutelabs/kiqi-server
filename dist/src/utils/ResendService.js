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
exports.sendEmail = void 0;
const resend_1 = require("resend");
const ApiError_1 = require("./ApiError");
const http_status_codes_1 = require("http-status-codes");
if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
}
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield resend.emails.send({
            from: options.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            replyTo: options.replyTo,
        });
        console.log('Email sent successfully via Resend:', data);
        return data;
    }
    catch (error) {
        console.error('Error sending email via Resend:', error);
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send email via Resend');
    }
});
exports.sendEmail = sendEmail;
