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
exports.CampaignController = void 0;
const campaign_service_impl_1 = require("../services/impl/campaign.service.impl");
const http_status_codes_1 = require("http-status-codes");
class CampaignController {
    constructor() {
        this.createCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Accept all campaign fields from the request body
                const { campaignName, subjectLine, status, emailListIds, senderEmail, deliveryStatus, category, campaignTopic, instructions, reward, startDate, endDate, time } = req.body;
                const created = yield this.campaignService.createCampaign({
                    campaignName,
                    subjectLine,
                    status,
                    emailListIds,
                    senderEmail,
                    deliveryStatus,
                    category,
                    campaignTopic,
                    instructions,
                    reward,
                    startDate,
                    endDate,
                    time
                });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: "Campaign has been created",
                    data: created,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllCampaigns = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const campaigns = yield this.campaignService.getAllCampaigns();
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: campaigns
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getCampaignById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const campaign = yield this.campaignService.getCampaignById(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: campaign
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.updateCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const { campaignName, subjectLine } = req.body;
                const updated = yield this.campaignService.updateCampaign(id, {
                    campaignName,
                    subjectLine
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Campaign has been updated.",
                    data: updated,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const deleted = yield this.campaignService.deleteCampaign(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Campaign has been deleted",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.startCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { campaignName, emailListId, subject, body, replyTo } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!campaignName || !emailListId || !subject || !body || !replyTo) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "All fields (campaignName, emailListId, subject, body, replyTo) are required."
                    });
                    return;
                }
                if (!userId) {
                    res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                        error: true,
                        message: "User not authenticated."
                    });
                    return;
                }
                // Fetch email list and validate ownership
                const emailList = yield this.campaignService.getEmailListForUser(emailListId, userId);
                if (!emailList) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Email list not found or does not belong to user."
                    });
                    return;
                }
                if (!emailList.emails || emailList.emails.length === 0) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Email list is empty."
                    });
                    return;
                }
                // Send emails (use fixed sender, dynamic replyTo)
                yield this.campaignService.sendBulkEmail(emailList.emails, subject, body, replyTo);
                // Save campaign record
                const campaign = yield this.campaignService.createCampaign({
                    campaignName,
                    subjectLine: subject,
                    status: 'Completed',
                    emailListIds: [emailListId],
                    senderEmail: process.env.EMAIL_FROM || 'no-reply@yourapp.com',
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Campaign started and emails sent.",
                    data: campaign
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Add an email list to a campaign
        this.addEmailListToCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { campaignId, emailListId } = req.body;
                if (!campaignId || !emailListId) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Both campaignId and emailListId are required."
                    });
                    return;
                }
                // Update the campaign to reference the email list
                const updatedCampaign = yield this.campaignService.addEmailListToCampaign(campaignId, emailListId);
                if (!updatedCampaign) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Campaign or Email List not found."
                    });
                    return;
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Email list added to campaign.",
                    data: updatedCampaign
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Fetch a campaign and its associated email list data
        this.getCampaignWithEmailList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const campaignWithList = yield this.campaignService.getCampaignWithEmailList(id);
                if (!campaignWithList) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Campaign not found."
                    });
                    return;
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: campaignWithList
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.campaignService = new campaign_service_impl_1.CampaignServiceImpl();
    }
}
exports.CampaignController = CampaignController;
