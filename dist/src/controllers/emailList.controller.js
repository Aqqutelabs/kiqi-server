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
exports.EmailListController = void 0;
const emailList_service_impl_1 = require("../services/impl/emailList.service.impl");
const http_status_codes_1 = require("http-status-codes");
class EmailListController {
    constructor() {
        this.createEmailList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                let { email_listName, emails, emailFiles } = req.body;
                // If a CSV file is uploaded, parse it
                if (req.file && req.file.mimetype === 'text/csv') {
                    const { parseEmailsFromCsv } = require('../utils/csvParser');
                    emails = parseEmailsFromCsv(req.file.buffer);
                }
                // Validate emails: must be array of objects with email (fullName is optional)
                if (!Array.isArray(emails) || emails.some(e => !e.email)) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Each email must have an email address. Format: [{ email: string, fullName?: string }]"
                    });
                    return;
                }
                // Only use _id, and ensure it's a valid ObjectId string
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId || typeof userId !== 'string' || userId.length !== 24) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Authenticated user does not have a valid MongoDB ObjectId (_id)."
                    });
                    return;
                }
                const emailList = yield this.emailListService.createEmailList({ email_listName, emails, emailFiles, userId });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: "Email list has been created.",
                    data: emailList
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllEmailLists = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const emailLists = yield this.emailListService.getAllEmailLists();
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    data: emailLists
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getEmailList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const emailList = yield this.emailListService.getEmailList(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: emailList
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.addEmailListContacts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { firstName, lastName, emailAddress, phoneNumber, groupEmailList } = req.body;
                const contact = yield this.emailListService.addEmailListContacts(id, { firstName, lastName, emailAddress, phoneNumber, groupEmailList });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: "Contact has been added to the email list.",
                    data: contact
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllContacts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const contacts = yield this.emailListService.getAllContacts();
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    contacts
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteEmailListContact = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const contactId = req.params.contactId;
                yield this.emailListService.deleteEmailListContact(id, contactId);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Contact has been deleted from the email list."
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getEmailListsByUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                const emailLists = yield this.emailListService.getEmailListsByUser(userId);
                res.status(200).json({
                    error: false,
                    data: emailLists
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteEmailList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.emailListService.deleteEmailList(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Email list has been deleted successfully."
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.emailListService = new emailList_service_impl_1.EmailistServiceImpl();
    }
}
exports.EmailListController = EmailListController;
