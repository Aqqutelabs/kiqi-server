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
// import { sendgridVerifySender } from '../utils/sendgridVerifySender';
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
        this.senderEmailService = new senderEmail_service_impl_1.SenderEmailServiceImpl();
    }
}
exports.SenderEmailController = SenderEmailController;
