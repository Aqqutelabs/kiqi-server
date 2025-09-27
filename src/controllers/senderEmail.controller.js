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
const sendgridVerifySender_1 = require("../utils/sendgridVerifySender");
class SenderEmailController {
    constructor() {
        this.createSenderEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { sender, type, email } = req.body;
                const created = yield this.senderEmailService.createSenderEmail(sender, type, email);
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
                const result = yield (0, sendgridVerifySender_1.sendgridVerifySender)({ nickname, fromEmail, fromName, replyTo, address, city, state, zip, country });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: 'Verification request sent to SendGrid',
                    data: result,
                });
            }
            catch (error) {
                const response = error === null || error === void 0 ? void 0 : error.response;
                if (response && response.data) {
                    const apiErrors = response.data.errors;
                    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
                        res.status(response.status || 400).json({
                            error: true,
                            message: apiErrors[0].message,
                            field: apiErrors[0].field,
                            details: apiErrors.length > 1 ? apiErrors : undefined
                        });
                        return;
                    }
                    res.status(response.status || 400).json({
                        error: true,
                        message: response.data.message || 'SendGrid API error',
                    });
                    return;
                }
                res.status(500).json({
                    error: true,
                    message: (error === null || error === void 0 ? void 0 : error.message) || 'Internal server error',
                });
            }
        });
        this.senderEmailService = new senderEmail_service_impl_1.SenderEmailServiceImpl();
    }
}
exports.SenderEmailController = SenderEmailController;
