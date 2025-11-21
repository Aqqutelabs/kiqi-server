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
exports.verifyEmailSender = void 0;
const resend_1 = require("resend");
const ApiError_1 = require("./ApiError");
const http_status_codes_1 = require("http-status-codes");
const verifyEmailSender = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    try {
        // With Resend, email verification is simpler as it's handled through their dashboard
        // We'll just validate that we can send from this email
        const testResult = yield resend.emails.send({
            from: `${options.fromName} <${options.fromEmail}>`,
            to: options.fromEmail, // Send a test email to the sender
            subject: 'Email Verification Test',
            html: `
        <h1>Email Verification Test</h1>
        <p>This is a test email to verify your sender email address.</p>
        <p>Sender Details:</p>
        <ul>
          <li>Nickname: ${options.nickname}</li>
          <li>Email: ${options.fromEmail}</li>
          <li>Name: ${options.fromName}</li>
          <li>Address: ${options.address}</li>
          <li>City: ${options.city}</li>
          <li>State: ${options.state}</li>
          <li>ZIP: ${options.zip}</li>
          <li>Country: ${options.country}</li>
        </ul>
      `,
            replyTo: options.replyTo || options.fromEmail,
        });
        if (!testResult.data) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
        }
        return {
            id: testResult.data.id,
            message: 'Verification email sent successfully',
        };
    }
    catch (error) {
        console.error('Error verifying email sender:', error);
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, (error === null || error === void 0 ? void 0 : error.message) || 'Failed to verify email sender');
    }
});
exports.verifyEmailSender = verifyEmailSender;
