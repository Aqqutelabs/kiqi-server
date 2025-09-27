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
exports.sendgridVerifySender = sendgridVerifySender;
const axios_1 = __importDefault(require("axios"));
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/verified_senders';
/**
 * Initiate sender email verification via SendGrid API.
 * @param {object} params - Sender verification parameters
 * @param {string} params.nickname - A label for the sender (e.g. user's name)
 * @param {string} params.fromEmail - The email address to verify
 * @param {string} params.fromName - The display name for the sender
 * @param {string} [params.replyTo] - (optional) Reply-to email address
 * @param {string} params.address - The street address of the sender
 * @param {string} params.city - The city of the sender
 * @param {string} params.state - The state of the sender
 * @param {string} params.zip - The ZIP code of the sender
 * @param {string} params.country - The country of the sender
 * @returns {Promise<object>} SendGrid API response
 */
function sendgridVerifySender(_a) {
    return __awaiter(this, arguments, void 0, function* ({ nickname, fromEmail, fromName, replyTo, replyToName, address, address2, city, state, zip, country }) {
        const payload = {
            nickname,
            from_email: fromEmail,
            from_name: fromName,
            reply_to: replyTo,
            reply_to_name: replyToName,
            address,
            address2,
            city,
            state,
            zip,
            country
        };
        // Remove undefined fields
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
        const response = yield axios_1.default.post(SENDGRID_API_URL, payload, {
            headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    });
}
