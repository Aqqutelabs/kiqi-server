"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const http_status_codes_1 = require("http-status-codes");
const Campaign_1 = require("../../models/Campaign");
const ApiError_1 = require("../../utils/ApiError");
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
            // Fetch campaign
            const campaign = yield Campaign_1.CampaignModel.findById(id);
            if (!campaign) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Campaign not found");
            }
            // Fetch user
            const userId = campaign.userId;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Campaign does not have a userId");
            }
            const { UserModel } = yield Promise.resolve().then(() => __importStar(require("../../models/User")));
            const user = yield UserModel.findById(userId);
            if (!user) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
            }
            // Get user's email to use as the reply-to address
            const replyToEmail = user.email;
            if (!replyToEmail) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "User email not found");
            }
            // Prepare email sending
            const fromAddress = process.env.EMAIL_FROM || "no-reply@yourapp.com"; // Verified domain with Resend
            // TODO: Fetch recipients from campaign.emailListIds
            // TODO: Integrate with SendGrid/Resend/etc. to send email
            try {
                // Example: sendEmail({
                //   from: fromAddress,
                //   to: recipients,
                //   subject: campaign.subjectLine,
                //   replyTo: replyToEmail,
                //   ...otherData
                // });
                // Simulate sending
                campaign.deliveryStatus = "Sent";
                yield campaign.save();
            }
            catch (err) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send campaign email");
            }
            return campaign;
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
            const { sendEmail } = require("../../utils/ResendService");
            const from = process.env.EMAIL_FROM || 'no-reply@yourapp.com';
            for (const entry of emails) {
                const to = entry.email || entry;
                yield sendEmail({
                    to,
                    subject,
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
