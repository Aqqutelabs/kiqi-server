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
exports.sendSms = void 0;
const twilio_1 = __importDefault(require("twilio"));
const ApiError_1 = require("./ApiError");
const http_status_codes_1 = require("http-status-codes");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER; // E.g. +1234567890
if (!accountSid || !authToken) {
    console.warn('Twilio credentials are not set. SMS sending will fail if attempted.');
}
const client = accountSid && authToken ? (0, twilio_1.default)(accountSid, authToken) : null;
const sendSms = (to, body, from) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client) {
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Twilio client not configured');
    }
    try {
        const msg = yield client.messages.create({
            body,
            to,
            from: from || twilioFrom,
        });
        return msg;
    }
    catch (err) {
        console.error('Twilio send error', err);
        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, (err === null || err === void 0 ? void 0 : err.message) || 'Failed to send SMS');
    }
});
exports.sendSms = sendSms;
