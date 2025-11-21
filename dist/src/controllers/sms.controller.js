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
exports.SmsController = void 0;
const sms_service_impl_1 = require("../services/impl/sms.service.impl");
const http_status_codes_1 = require("http-status-codes");
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
class SmsController {
    constructor() {
        this.createSender = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { name, sampleMessage } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const sender = yield this.smsService.createSender(name, sampleMessage, userId);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({ error: false, data: sender });
            }
            catch (err) {
                next(err);
            }
        });
        this.getSenders = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const list = yield this.smsService.getSendersByUser(userId);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: list });
            }
            catch (err) {
                next(err);
            }
        });
        this.updateSender = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { name, sampleMessage } = req.body;
                const updated = yield this.smsService.updateSender(id, { name, sampleMessage });
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: updated });
            }
            catch (err) {
                next(err);
            }
        });
        this.deleteSender = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.smsService.deleteSender(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Sender deleted' });
            }
            catch (err) {
                next(err);
            }
        });
        this.sendMessage = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { to, body, from } = req.body;
                if (!to || !body) {
                    throw new ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Missing required fields: to, body');
                }
                const result = yield this.smsService.sendMessage(to, body, from);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: result });
            }
            catch (err) {
                next(err);
            }
        });
        this.createRecipientGroup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { name } = req.body;
                let contacts = [];
                // Accept contacts from body (JSON array or comma-separated string)
                if (Array.isArray(req.body.contacts)) {
                    contacts = req.body.contacts;
                }
                else if (typeof req.body.contacts === 'string') {
                    contacts = req.body.contacts.split(',').map((s) => s.trim()).filter(Boolean);
                }
                // If a CSV file is uploaded, parse it and extract phone numbers
                if (req.file && req.file.buffer) {
                    const { parse } = require('csv-parse/sync');
                    const csvRows = parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true });
                    // Accept columns: phone, Phone, phoneNumber, PhoneNumber
                    const csvContacts = csvRows.map((row) => row.phone || row.Phone || row.phoneNumber || row.PhoneNumber).filter((n) => !!n);
                    contacts = contacts.concat(csvContacts);
                }
                // Remove duplicates and empty
                contacts = Array.from(new Set(contacts)).filter(Boolean);
                if (!name) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'Group name is required.' });
                }
                if (contacts.length === 0) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'At least one contact must be provided, either manually or via CSV upload.' });
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const group = yield this.smsService.createRecipientGroup(name, contacts, userId);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({ error: false, data: group });
            }
            catch (err) {
                next(err);
            }
        });
        this.getRecipientGroups = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const groups = yield this.smsService.getRecipientGroups(userId);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: groups });
            }
            catch (err) {
                next(err);
            }
        });
        this.updateRecipientGroup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { name, contacts } = req.body;
                const updated = yield this.smsService.updateRecipientGroup(id, { name, contacts });
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: updated });
            }
            catch (err) {
                next(err);
            }
        });
        this.deleteRecipientGroup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.smsService.deleteRecipientGroup(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Recipient group deleted' });
            }
            catch (err) {
                next(err);
            }
        });
        this.sendNow = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { recipients, message, senderId } = req.body; // recipients: array
                const sender = senderId ? yield this.smsService.getSendersByUser((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) : null;
                const from = senderId ? undefined : undefined; // placeholder - Twilio from is configured via env
                const result = yield this.smsService.sendBulkSms(recipients, message, from);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: result });
            }
            catch (err) {
                next(err);
            }
        });
        // Templates
        this.createTemplate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { title, message } = req.body;
                if (!title || !message) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'Title and message are required' });
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const tpl = yield this.smsService.createTemplate(title, message, userId);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({ error: false, data: tpl });
            }
            catch (err) {
                next(err);
            }
        });
        this.getTemplates = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const list = yield this.smsService.getTemplates(userId);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: list });
            }
            catch (err) {
                next(err);
            }
        });
        this.getTemplateById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const tpl = yield this.smsService.getTemplateById(id);
                if (!tpl)
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: 'Template not found' });
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: tpl });
            }
            catch (err) {
                next(err);
            }
        });
        this.updateTemplate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { title, message } = req.body;
                const updated = yield this.smsService.updateTemplate(id, { title, message });
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: updated });
            }
            catch (err) {
                next(err);
            }
        });
        this.deleteTemplate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.smsService.deleteTemplate(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Template deleted' });
            }
            catch (err) {
                next(err);
            }
        });
        this.sendTemplate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { recipients, groupId, senderId } = req.body;
                const tpl = yield this.smsService.getTemplateById(id);
                if (!tpl)
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: 'Template not found' });
                let targets = [];
                if (Array.isArray(recipients))
                    targets = recipients;
                if (groupId) {
                    const group = yield this.smsService.getRecipientGroupById(groupId);
                    if (group && Array.isArray(group.contacts)) {
                        targets = targets.concat(group.contacts.map((c) => c.phone));
                    }
                }
                targets = Array.from(new Set(targets)).filter(Boolean);
                if (targets.length === 0)
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'No recipients provided' });
                const from = senderId || undefined; // use provided senderId or configured Twilio from
                const result = yield this.smsService.sendBulkSms(targets, tpl.message, from);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: result });
            }
            catch (err) {
                next(err);
            }
        });
        // --- Drafts ---
        this.createDraft = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const { message, recipients, recipientsGroupId, title } = req.body;
                if (!message || (!recipients && !recipientsGroupId)) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'Message and recipients or group are required' });
                }
                const draft = yield this.smsService.createDraft({ message, recipients, recipientsGroupId, title, userId });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({ error: false, data: draft });
            }
            catch (err) {
                next(err);
            }
        });
        this.getDrafts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                const drafts = yield this.smsService.getDrafts(userId);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: drafts });
            }
            catch (err) {
                next(err);
            }
        });
        this.getDraftById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const draft = yield this.smsService.getDraftById(id);
                if (!draft)
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: 'Draft not found' });
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: draft });
            }
            catch (err) {
                next(err);
            }
        });
        this.updateDraft = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { message, recipients, recipientsGroupId, title } = req.body;
                const updated = yield this.smsService.updateDraft(id, { message, recipients, recipientsGroupId, title });
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: updated });
            }
            catch (err) {
                next(err);
            }
        });
        this.deleteDraft = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.smsService.deleteDraft(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Draft deleted' });
            }
            catch (err) {
                next(err);
            }
        });
        this.sendDraft = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const result = yield this.smsService.sendDraft(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, data: result });
            }
            catch (err) {
                next(err);
            }
        });
        this.smsService = new sms_service_impl_1.SmsServiceImpl();
    }
}
exports.SmsController = SmsController;
