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
exports.CampaignServiceImpl = void 0;
const Campaign_1 = require("../../models/Campaign");
class CampaignServiceImpl {
    createCampaign(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCampaignExists = yield Campaign_1.CampaignModel.findOne({
                campaignName: data.campaignName
            });
            const campaign = yield Campaign_1.CampaignModel.create({
                campaignName: data.campaignName,
                subjectLine: data.subjectLine,
                status: data.status,
                userId: data.userId,
                emailListIds: data.emailListIds,
                senderEmail: data.senderEmail,
                deliveryStatus: data.deliveryStatus,
                category: data.category,
                campaignTopic: data.campaignTopic,
                instructions: data.instructions,
                reward: data.reward,
                startDate: data.startDate,
                endDate: data.endDate,
                time: data.time
            });
            return campaign;
        });
    }
    getAllCampaigns() {
        return __awaiter(this, void 0, void 0, function* () {
            return Campaign_1.CampaignModel.find().populate('emailListIds');
        });
    }
    getCampaignById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Campaign_1.CampaignModel.findById(id).populate('emailListIds');
        });
    }
    updateCampaign(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield Campaign_1.CampaignModel.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true,
                updatedAt: Date.now()
            });
            if (!updated) {
                throw new Error("Campaign not found or updated");
            }
            return updated;
        });
    }
    deleteCampaign(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Campaign_1.CampaignModel.findByIdAndDelete(id);
        });
    }
    sendCampaign(id) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    scheduleCampaign(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // const campaignId = await CampaignModel.findById(id)
            throw new Error("Method not implemented.");
        });
    }
    getCampaignDeliveryStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    getEmailListForUser(emailListId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const EmailListModel = require("../../models/EmailList").EmailListModel;
            return EmailListModel.findOne({ _id: emailListId, userId });
        });
    }
    sendBulkEmail(emails, subject, body, replyTo) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sendEmail } = require("../../utils/SendGridService");
            const from = process.env.EMAIL_FROM || 'no-reply@yourapp.com';
            for (const entry of emails) {
                const to = entry.email || entry;
                yield sendEmail({
                    to,
                    subject,
                    text: body,
                    html: body,
                    from,
                    replyTo
                });
            }
        });
    }
    // Add an email list to a campaign
    addEmailListToCampaign(campaignId, emailListId) {
        return __awaiter(this, void 0, void 0, function* () {
            const campaign = yield Campaign_1.CampaignModel.findById(campaignId);
            if (!campaign)
                return null;
            campaign.emailListId = emailListId;
            yield campaign.save();
            return campaign;
        });
    }
    // Fetch a campaign and its associated email list data
    getCampaignWithEmailList(campaignId) {
        return __awaiter(this, void 0, void 0, function* () {
            return Campaign_1.CampaignModel.findById(campaignId).populate('emailListId');
        });
    }
}
exports.CampaignServiceImpl = CampaignServiceImpl;
