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
exports.SmsServiceImpl = void 0;
const SmsSender_1 = require("../../models/SmsSender");
const RecipientGroup_1 = require("../../models/RecipientGroup");
const SmsTemplate_1 = require("../../models/SmsTemplate");
const SmsDraft_1 = require("../../models/SmsDraft");
const TwilioService_1 = require("../../utils/TwilioService");
const ApiError_1 = require("../../utils/ApiError");
const http_status_codes_1 = require("http-status-codes");
class SmsServiceImpl {
    createSender(name, sampleMessage, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sender = yield SmsSender_1.SmsSenderModel.create({ name, sampleMessage, userId });
            return sender;
        });
    }
    getSendersByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return SmsSender_1.SmsSenderModel.find({ userId });
        });
    }
    updateSender(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield SmsSender_1.SmsSenderModel.findByIdAndUpdate(id, data, { new: true });
            if (!updated)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Sender not found');
            return updated;
        });
    }
    deleteSender(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield SmsSender_1.SmsSenderModel.findByIdAndDelete(id);
        });
    }
    createRecipientGroup(name, contacts, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const group = yield RecipientGroup_1.RecipientGroupModel.create({ name, contacts: contacts.map((p) => ({ phone: p })), userId });
            return group;
        });
    }
    getRecipientGroups(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return RecipientGroup_1.RecipientGroupModel.find({ userId });
        });
    }
    getRecipientGroupById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return RecipientGroup_1.RecipientGroupModel.findById(id);
        });
    }
    updateRecipientGroup(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateData = {};
            if (data.name)
                updateData.name = data.name;
            if (Array.isArray(data.contacts))
                updateData.contacts = data.contacts.map((p) => ({ phone: p }));
            const updated = yield RecipientGroup_1.RecipientGroupModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updated)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Recipient group not found');
            return updated;
        });
    }
    sendMessage(to, body, from) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, TwilioService_1.sendSms)(to, body, from);
            return result;
        });
    }
    deleteRecipientGroup(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield RecipientGroup_1.RecipientGroupModel.findByIdAndDelete(id);
        });
    }
    createTemplate(title, message, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tpl = yield SmsTemplate_1.SmsTemplateModel.create({ title, message, userId });
            return tpl;
        });
    }
    getTemplates(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return SmsTemplate_1.SmsTemplateModel.find({ userId });
        });
    }
    deleteTemplate(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield SmsTemplate_1.SmsTemplateModel.findByIdAndDelete(id);
        });
    }
    getTemplateById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return SmsTemplate_1.SmsTemplateModel.findById(id);
        });
    }
    updateTemplate(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateData = {};
            if (data.title)
                updateData.title = data.title;
            if (data.message)
                updateData.message = data.message;
            const updated = yield SmsTemplate_1.SmsTemplateModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updated)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Template not found');
            return updated;
        });
    }
    createDraft(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const draft = yield SmsDraft_1.SmsDraftModel.create(data);
            return draft;
        });
    }
    getDrafts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return SmsDraft_1.SmsDraftModel.find({ userId });
        });
    }
    deleteDraft(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield SmsDraft_1.SmsDraftModel.findByIdAndDelete(id);
        });
    }
    getDraftById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return SmsDraft_1.SmsDraftModel.findById(id);
        });
    }
    updateDraft(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield SmsDraft_1.SmsDraftModel.findByIdAndUpdate(id, data, { new: true });
            if (!updated)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Draft not found');
            return updated;
        });
    }
    sendDraft(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const draft = yield SmsDraft_1.SmsDraftModel.findById(id);
            if (!draft)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Draft not found');
            // Use recipients from group or direct
            let recipients = draft.recipients || [];
            if ((!recipients || recipients.length === 0) && draft.recipientsGroupId) {
                const group = yield RecipientGroup_1.RecipientGroupModel.findById(draft.recipientsGroupId);
                if (group && Array.isArray(group.contacts)) {
                    recipients = group.contacts.map((c) => c.phone);
                }
            }
            recipients = Array.from(new Set(recipients)).filter(Boolean);
            if (recipients.length === 0)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No recipients for draft');
            const results = yield this.sendBulkSms(recipients, draft.message);
            draft.status = 'sent';
            yield draft.save();
            return { draft, results };
        });
    }
    sendBulkSms(recipients, message, from) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const to of recipients) {
                // basic phone validation
                const normalized = (to || '').toString().replace(/\s+/g, '');
                if (!normalized.match(/^\+?\d{7,15}$/)) {
                    // skip invalid numbers
                    results.push({ to, status: 'invalid' });
                    continue;
                }
                const res = yield (0, TwilioService_1.sendSms)(normalized, message, from);
                results.push({ to, sid: res.sid, status: 'sent' });
            }
            return results;
        });
    }
}
exports.SmsServiceImpl = SmsServiceImpl;
