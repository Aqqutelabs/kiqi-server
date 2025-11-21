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
exports.SenderEmailController = void 0;
const http_status_codes_1 = require("http-status-codes");
const senderEmail_service_impl_1 = require("../services/impl/senderEmail.service.impl");
const emailVerification_1 = require("../utils/emailVerification");
class SenderEmailController {
    constructor() {
        this.createSenderEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sender, type, email } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const created = yield this.senderEmailService.createSenderEmail(sender, type, email, userId);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: "Sender email created successfully",
                    data: created,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getSenderEmailById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const senderEmail = yield this.senderEmailService.getSenderEmailById(id);
                if (!senderEmail) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Sender email not found",
                    });
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: senderEmail,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllSenderEmails = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const senders = yield this.senderEmailService.getAllSenderEmails();
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: senders,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.updateSenderEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { senderName, senderEmail, type } = req.body;
                const updated = yield this.senderEmailService.updateSenderEmail(id, {
                    senderName,
                    senderEmail,
                    type,
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Sender email updated successfully",
                    data: updated,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteSenderEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.senderEmailService.deleteSenderEmail(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Sender email deleted successfully",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.verifySender = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Accept both camelCase and snake_case
                const nickname = req.body.nickname;
                const fromEmail = req.body.fromEmail || req.body.from_email;
                const fromName = req.body.fromName || req.body.from_name;
                const replyTo = req.body.replyTo || req.body.reply_to;
                const address = req.body.address;
                const city = req.body.city;
                const state = req.body.state;
                const zip = req.body.zip;
                const country = req.body.country;
                if (!nickname || !fromEmail || !fromName || !address || !city || !state || !zip || !country) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "nickname, fromEmail, fromName, address, city, state, zip, and country are required"
                    });
                    return;
                }
                const result = yield (0, emailVerification_1.verifyEmailSender)({
                    nickname,
                    fromEmail,
                    fromName,
                    replyTo,
                    address,
                    city,
                    state,
                    zip,
                    country
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: 'Verification email sent successfully',
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.requestVerificationOtp = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // OTP-based verification flow has been removed. Use SendGrid verification endpoints instead.
            res.status(http_status_codes_1.StatusCodes.METHOD_NOT_ALLOWED).json({ error: true, message: 'OTP verification is disabled. Use /sendgrid/request-verification' });
        });
        this.verifyOtp = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // OTP-based verification flow has been removed. Use SendGrid verification endpoints instead.
            res.status(http_status_codes_1.StatusCodes.METHOD_NOT_ALLOWED).json({ error: true, message: 'OTP verification is disabled. Use /sendgrid/confirm-verification' });
        });
        // New: request SendGrid verification (creates sender in SendGrid which sends verification email)
        this.requestSendGridVerification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Accept multiple field name variants to be more forgiving of client payloads
                const body = req.body || {};
                const nickname = body.nickname || body.nick || body.name;
                const senderName = body.senderName || body.sender_name || body.fromName || body.from_name || body.sender || body.name;
                const email = body.email || body.from_email || body.fromEmail || body.senderEmail || body.sender_email || body.reply_to;
                const address = body.address || body.addr || '';
                const city = body.city || '';
                const state = body.state || '';
                const zip = body.zip || '';
                const country = body.country || 'US';
                if (!email || !senderName) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'senderName and email are required (accepted keys: senderName, sender_name, fromName, from_name and email, from_email, senderEmail)' });
                    return;
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const sender = yield this.senderEmailService.requestSendGridVerification(nickname || senderName, senderName, email, address, city, state, zip, country, userId);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'SendGrid verification initiated', data: sender });
            }
            catch (error) {
                next(error);
            }
        });
        // New: confirm SendGrid verification (checks SendGrid and marks local sender verified)
        this.confirmSendGridVerification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const body = req.body || {};
                const senderId = body.senderId || body.sender_id || body.id;
                const token = body.token || body.verifyToken || body.verification_token;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                let sender;
                if (token) {
                    sender = yield this.senderEmailService.confirmSendGridVerificationByToken(token, userId);
                }
                else if (senderId) {
                    sender = yield this.senderEmailService.confirmSendGridVerification(senderId, userId);
                }
                else {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'senderId or token is required' });
                    return;
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Sender verified', data: sender });
            }
            catch (error) {
                next(error);
            }
        });
        // New: retrieve the user's verified SendGrid sender email
        this.getUserVerifiedSender = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: true, message: 'Not authenticated' });
                    return;
                }
                const sender = yield this.senderEmailService.getUserVerifiedSender(userId);
                if (!sender) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: 'No verified sender found for user' });
                    return;
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Verified sender found', data: sender });
            }
            catch (error) {
                next(error);
            }
        });
        this.senderEmailService = new senderEmail_service_impl_1.SenderEmailServiceImpl();
    }
}
exports.SenderEmailController = SenderEmailController;
