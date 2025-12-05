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
const ApiError_1 = require("../utils/ApiError");
/**
 * Handles HTTP requests related to email campaigns.
 * Interacts with CampaignServiceImpl for business logic.
 */
class CampaignController {
    constructor() {
        this.createCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { campaignName, subjectLine, senderId, body, autoStart, scheduledAt, audience } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    throw new Error("User not authenticated");
                }
                if (!senderId) {
                    throw new Error("senderId is required");
                }
                // If autoStart is true, audience is required
                if (autoStart) {
                    if (!audience) {
                        throw new Error("audience is required when autoStart is true");
                    }
                    const hasEmailLists = audience.emailLists && Array.isArray(audience.emailLists) && audience.emailLists.length > 0;
                    const hasManualEmails = audience.manualEmails && Array.isArray(audience.manualEmails) && audience.manualEmails.length > 0;
                    if (!hasEmailLists && !hasManualEmails) {
                        throw new Error("audience must contain either emailLists or manualEmails");
                    }
                }
                // Validate scheduledAt if autoStart is true
                if (autoStart && scheduledAt) {
                    const scheduledDate = new Date(scheduledAt);
                    if (isNaN(scheduledDate.getTime())) {
                        throw new Error("Invalid scheduledAt date format");
                    }
                    if (scheduledDate < new Date()) {
                        throw new Error("scheduledAt must be in the future");
                    }
                }
                const campaignData = {
                    campaignName,
                    subjectLine,
                    content: body ? { htmlContent: body, plainText: body } : undefined,
                    senderId,
                    user_id: userId,
                    audience: audience || { emailLists: [], excludeLists: [], manualEmails: [] }
                };
                let response;
                if (autoStart) {
                    // Create campaign and schedule it to start
                    // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
                    response = yield this.campaignService.createAndScheduleCampaign(campaignData, scheduledAt ? new Date(scheduledAt) : new Date());
                    res.status(http_status_codes_1.StatusCodes.CREATED).json({
                        error: false,
                        message: scheduledAt
                            ? "Campaign has been created and scheduled for later"
                            : "Campaign has been created and scheduled to start immediately",
                        data: response.campaign,
                        jobId: response.jobId
                    });
                }
                else {
                    // Just create campaign in Draft status
                    const created = yield this.campaignService.createCampaign(campaignData);
                    res.status(http_status_codes_1.StatusCodes.CREATED).json({
                        error: false,
                        message: "Campaign has been created",
                        data: created,
                    });
                }
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllCampaigns = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
                }
                const campaigns = yield this.campaignService.getAllCampaigns(userId);
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
            var _a;
            try {
                const id = req.params.id;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
                }
                const campaign = yield this.campaignService.getCampaignById(id, userId);
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
            var _a;
            try {
                const id = req.params.id;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
                }
                const { campaignName, subjectLine, body } = req.body;
                const updated = yield this.campaignService.updateCampaign(id, userId, Object.assign({ campaignName,
                    subjectLine }, (body ? { content: { htmlContent: body, plainText: body } } : {})));
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
            var _a;
            try {
                const id = req.params.id;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
                }
                yield this.campaignService.deleteCampaign(id, userId);
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
                // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
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
                // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
                yield this.campaignService.sendBulkEmail(emailList.emails, subject, body, replyTo);
                // Save campaign record
                const campaign = yield this.campaignService.createCampaign({
                    campaignName,
                    subjectLine: subject,
                    content: body ? { htmlContent: body, plainText: body } : undefined,
                    senderId: process.env.EMAIL_FROM || 'noreply@data.widernetfarms.org', // Using senderId as a proxy for sender email
                    user_id: userId,
                    audience: { emailLists: [emailListId], excludeLists: [], manualEmails: [] }
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
                // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
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
                // NOTE: Missing userId check in controller, but the service method now exists
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
        // Search campaigns by name, subject, or category
        this.searchCampaigns = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { q, status, limit, page } = req.query;
                if (!q || typeof q !== 'string') {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Search query (q) is required");
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
                }
                const { results, total } = yield this.campaignService.searchCampaigns(userId, q, {
                    status: status,
                    limit: Number(limit) || 20,
                    page: Number(page) || 1
                });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: {
                        campaigns: results,
                        total,
                        limit: Number(limit) || 20,
                        page: Number(page) || 1
                    }
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
