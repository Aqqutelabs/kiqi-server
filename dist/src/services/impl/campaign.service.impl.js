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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignServiceImpl = void 0;
const types_1 = require("../types");
const SenderEmail_1 = require("../../models/SenderEmail");
const axios_1 = __importDefault(require("axios"));
const EmailService_1 = require("../../utils/EmailService");
const EmailList_1 = require("../../models/EmailList");
// Mock Data Storage for demonstration
const mockCampaigns = [];
const mockEmailLists = [{
        _id: "list-123",
        name: "Mock Subscribers",
        user_id: "user-456",
        emails: ["test1@example.com", "test2@example.com"]
    }];
/**
 * CampaignServiceImpl contains the business logic for managing email campaigns.
 * All methods are defined as public to be accessible by the CampaignController.
 */
class CampaignServiceImpl {
    /**
     * Creates a campaign and schedules it for immediate or future sending.
     * @param campaignData The base data for the campaign.
     * @param scheduledAt The date/time to send the campaign.
     * @returns The created campaign and the scheduling job ID.
     */
    createAndScheduleCampaign(campaignData, scheduledAt) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Scheduling campaign '${campaignData.campaignName}' for ${scheduledAt.toISOString()}`);
            // Resolve sender: accept local sender _id, a SendGrid sender id, or an email address.
            if (!campaignData.senderId) {
                throw new types_1.ApiError(types_1.StatusCodes.BAD_REQUEST, 'senderId (local id, sendgridId, or email) is required to schedule a campaign');
            }
            // Helper: try to resolve a SenderModel by different identifiers
            const resolveSender = (identifier) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                // Try local _id first
                try {
                    const byId = yield SenderEmail_1.SenderModel.findById(identifier);
                    if (byId)
                        return byId;
                }
                catch (e) {
                    // ignore invalid ObjectId error
                }
                // Try stored sendgridId
                let bySg = yield SenderEmail_1.SenderModel.findOne({ sendgridId: identifier });
                if (bySg)
                    return bySg;
                // If identifier looks like an email, search by senderEmail
                if (identifier.includes('@')) {
                    const byEmail = yield SenderEmail_1.SenderModel.findOne({ senderEmail: identifier.toLowerCase() });
                    if (byEmail)
                        return byEmail;
                }
                // If it looks like a SendGrid id (heuristic: contains '-' or starts with 'sg'), try fetching from SendGrid
                const looksLikeSgId = identifier.startsWith('sg_') || identifier.indexOf('-') !== -1;
                if (looksLikeSgId) {
                    const key = process.env.SENDGRID_API_KEY;
                    if (!key)
                        return null;
                    try {
                        const resp = yield axios_1.default.get(`https://api.sendgrid.com/v3/verified_senders/${encodeURIComponent(identifier)}`, {
                            headers: { Authorization: `Bearer ${key}` }
                        });
                        const body = resp.data || {};
                        const email = body.from_email || body.email || body.from || body.from_email_address;
                        const name = body.from_name || body.from_name || body.nickname || undefined;
                        const isVerified = body.verified === true || body.status === 'verified' || body.is_verified === true;
                        if (email) {
                            // Upsert local sender record so we have it locally for future use
                            let local = yield SenderEmail_1.SenderModel.findOne({ senderEmail: email.toLowerCase() });
                            if (!local) {
                                local = yield SenderEmail_1.SenderModel.create({ senderName: name || email, type: 'sendgrid', senderEmail: email.toLowerCase(), verified: !!isVerified, sendgridId: identifier });
                            }
                            else {
                                local.sendgridId = identifier;
                                local.verified = !!isVerified;
                                local.type = 'sendgrid';
                                yield local.save();
                            }
                            return local;
                        }
                    }
                    catch (err) {
                        // ignore SendGrid lookup errors here; caller will handle absence
                        const e = err;
                        console.error('[CampaignService] SendGrid lookup failed for id:', identifier, ((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || (e === null || e === void 0 ? void 0 : e.message) || e);
                    }
                }
                return null;
            });
            const senderRecord = yield resolveSender(String(campaignData.senderId));
            if (!senderRecord || !senderRecord.verified) {
                throw new types_1.ApiError(types_1.StatusCodes.BAD_REQUEST, 'Sender email not found or not verified');
            }
            // Ensure campaignData.senderId stores the local sender _id so later sending routines can find it.
            try {
                campaignData.senderId = senderRecord._id;
            }
            catch (e) {
                // ignore if unable to overwrite
            }
            const newCampaign = Object.assign(Object.assign({ _id: `camp-${Date.now()}` }, campaignData), { status: 'Scheduled', createdAt: new Date() });
            mockCampaigns.push(newCampaign);
            // Trigger email sending immediately (or queue for later if scheduledAt is in future)
            const isImmediate = scheduledAt <= new Date();
            if (isImmediate) {
                // Send emails now (non-blocking)
                this.sendCampaignEmails(newCampaign).catch(err => console.error(`Error sending campaign ${newCampaign._id}:`, err));
            }
            else {
                // In production, queue this with a job scheduler (e.g., BullMQ)
                console.log(`Campaign ${newCampaign._id} queued for ${scheduledAt.toISOString()}`);
            }
            return {
                campaign: newCampaign,
                jobId: `job-${newCampaign._id}`
            };
        });
    }
    /**
     * Sends campaign emails to all recipients in the audience.
     * @param campaign The campaign to send.
     */
    sendCampaignEmails(campaign) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                console.log(`Sending emails for campaign ${campaign._id}...`);
                const recipients = [];
                // Get emails from email lists
                if (((_a = campaign.audience) === null || _a === void 0 ? void 0 : _a.emailLists) && campaign.audience.emailLists.length > 0) {
                    for (const listId of campaign.audience.emailLists) {
                        const emailList = yield EmailList_1.EmailListModel.findById(listId);
                        if (emailList && emailList.emails) {
                            const emails = emailList.emails.map((e) => typeof e === "string" ? e : e === null || e === void 0 ? void 0 : e.email).filter(Boolean);
                            recipients.push(...emails);
                        }
                    }
                }
                // Add manual emails
                if (((_b = campaign.audience) === null || _b === void 0 ? void 0 : _b.manualEmails) && campaign.audience.manualEmails.length > 0) {
                    recipients.push(...campaign.audience.manualEmails);
                }
                // Remove duplicates
                const uniqueRecipients = [...new Set(recipients)];
                console.log(`Sending campaign to ${uniqueRecipients.length} recipients`);
                // Determine 'from' address from senderId (must be verified)
                let fromAddress = process.env.EMAIL_FROM;
                let replyToAddress = undefined;
                let fromObject = fromAddress;
                let resolvedSendgridId = undefined;
                if (campaign.senderId) {
                    const senderRec = yield SenderEmail_1.SenderModel.findById(campaign.senderId);
                    if (senderRec && senderRec.verified) {
                        // Use the verified sender's email (and name) as the 'from' address
                        fromObject = { email: senderRec.senderEmail, name: senderRec.senderName };
                        resolvedSendgridId = senderRec.sendgridId;
                    }
                }
                // Pre-send verification: ensure SendGrid shows this sender as verified to avoid 403 at send time
                try {
                    const key = process.env.SENDGRID_API_KEY;
                    if (key && fromObject && typeof fromObject === 'object' && fromObject.email) {
                        // Use the list endpoint to find and verify the sender by email
                        const listResp = yield axios_1.default.get('https://api.sendgrid.com/v3/verified_senders', {
                            headers: { Authorization: `Bearer ${key}` }
                        });
                        const listBody = listResp.data || {};
                        const results = Array.isArray(listBody.result) ? listBody.result : (Array.isArray(listBody) ? listBody : listBody.results || []);
                        const match = results.find((e) => {
                            const entryEmail = e.from_email || e.from_email_address || e.email || e.from;
                            return entryEmail && String(entryEmail).toLowerCase() === String(fromObject.email).toLowerCase();
                        });
                        if (!match) {
                            throw new types_1.ApiError(types_1.StatusCodes.BAD_REQUEST, `No verified SendGrid sender found for email ${fromObject.email}`);
                        }
                        const isVerified = match.verified === true || match.status === 'verified' || match.is_verified === true;
                        if (!isVerified) {
                            throw new types_1.ApiError(types_1.StatusCodes.BAD_REQUEST, `SendGrid sender for email ${fromObject.email} is not verified`);
                        }
                        // store sendgrid id locally if present
                        const sgId = match.id || match._id || match.sender_id;
                        if (sgId) {
                            resolvedSendgridId = sgId;
                            const local = yield SenderEmail_1.SenderModel.findOne({ senderEmail: String(fromObject.email).toLowerCase() });
                            if (local) {
                                local.sendgridId = String(sgId);
                                local.verified = true;
                                yield local.save();
                            }
                        }
                    }
                }
                catch (err) {
                    const e = err;
                    console.error('[CampaignService] Pre-send SendGrid verification failed:', ((_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.data) || (e === null || e === void 0 ? void 0 : e.message) || e);
                    throw err;
                }
                // Send to each recipient
                for (const recipient of uniqueRecipients) {
                    try {
                        // Debug: print resolved from and SendGrid sender id (dev-only)
                        if (process.env.NODE_ENV !== 'production') {
                            try {
                                console.log(`[Email][Debug] campaign=${campaign._id} to=${recipient} from=${JSON.stringify(fromObject)} sendgridId=${resolvedSendgridId}`);
                            }
                            catch (dbgErr) {
                                console.log('[Email][Debug] failed to stringify fromObject', dbgErr);
                            }
                        }
                        yield (0, EmailService_1.sendEmail)({
                            to: recipient,
                            subject: campaign.subjectLine,
                            html: ((_d = campaign.content) === null || _d === void 0 ? void 0 : _d.htmlContent) || "<p>Email content</p>",
                            text: ((_e = campaign.content) === null || _e === void 0 ? void 0 : _e.plainText) || "Email content",
                            from: fromObject,
                            replyTo: replyToAddress
                        });
                    }
                    catch (err) {
                        console.error(`Failed to send to ${recipient}:`, err);
                    }
                }
                console.log(`Campaign ${campaign._id} sent successfully`);
            }
            catch (err) {
                const e = err;
                console.error(`Error in sendCampaignEmails:`, (e === null || e === void 0 ? void 0 : e.message) || e);
                throw err;
            }
        });
    }
    /**
     * Update simple campaign analytics counters (deliveries, bounces).
     * This is a lightweight in-memory implementation for the mock service used in tests and local runs.
     */
    updateCampaignAnalytics(campaignId_1, metric_1) {
        return __awaiter(this, arguments, void 0, function* (campaignId, metric, delta = 1) {
            const idx = mockCampaigns.findIndex(c => String(c._id) === String(campaignId));
            if (idx === -1)
                return;
            const c = mockCampaigns[idx];
            c.analytics = c.analytics || { deliveries: 0, bounces: 0 };
            const key = metric;
            if (typeof c.analytics[key] !== 'number')
                c.analytics[key] = 0;
            c.analytics[key] += delta;
            mockCampaigns[idx] = c;
        });
    }
    /**
     * Creates a campaign in 'Draft' status.
     * @param campaignData The base data for the campaign.
     * @returns The created campaign object.
     */
    createCampaign(campaignData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Creating campaign draft: ${campaignData.campaignName}`);
            const newCampaign = Object.assign(Object.assign({ _id: `camp-${Date.now()}` }, campaignData), { status: 'Draft', createdAt: new Date() }); // Type assertion needed due to initial interface design
            mockCampaigns.push(newCampaign);
            return newCampaign;
        });
    }
    /**
     * Fetches all campaigns for a specific user ID.
     * @param userId The ID of the authenticated user.
     * @returns An array of campaigns.
     */
    getAllCampaigns(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Fetching all campaigns for user: ${userId}`);
            // Mock logic: filter mock campaigns by user ID
            return mockCampaigns.filter(c => c.user_id === userId);
        });
    }
    /**
     * Fetches a single campaign by ID, ensuring ownership.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @returns The campaign object.
     * @throws ApiError if not found or unauthorized.
     */
    getCampaignById(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Fetching campaign ID ${id} for user ${userId}`);
            const campaign = mockCampaigns.find(c => c._id === id);
            if (!campaign || campaign.user_id !== userId) {
                throw new types_1.ApiError(types_1.StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
            }
            return campaign;
        });
    }
    /**
     * Updates fields of a campaign.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @param updateData The fields to update.
     * @returns The updated campaign object.
     * @throws ApiError if not found or unauthorized.
     */
    updateCampaign(id, userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Updating campaign ID ${id}`);
            const index = mockCampaigns.findIndex(c => c._id === id);
            if (index === -1 || mockCampaigns[index].user_id !== userId) {
                throw new types_1.ApiError(types_1.StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
            }
            const updatedCampaign = Object.assign(Object.assign({}, mockCampaigns[index]), updateData);
            mockCampaigns[index] = updatedCampaign;
            return updatedCampaign;
        });
    }
    /**
     * Deletes a campaign.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @throws ApiError if not found or unauthorized.
     */
    deleteCampaign(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Deleting campaign ID ${id}`);
            const initialLength = mockCampaigns.length;
            const index = mockCampaigns.findIndex(c => c._id === id && c.user_id === userId);
            if (index === -1) {
                throw new types_1.ApiError(types_1.StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
            }
            mockCampaigns.splice(index, 1);
            console.log(`Successfully deleted campaign ID ${id}.`);
        });
    }
    /**
     * Fetches an email list, ensuring it belongs to the user.
     * @param emailListId The email list ID.
     * @param userId The ID of the authenticated user.
     * @returns The EmailList object or null if not found.
     */
    getEmailListForUser(emailListId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Fetching email list ${emailListId} for user ${userId}`);
            const list = mockEmailLists.find(l => l._id === emailListId && l.user_id === userId);
            return list || null;
        });
    }
    /**
     * Mocks the bulk email sending process.
     */
    sendBulkEmail(emails, subject, body, replyTo) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Sending ${emails.length} emails with subject: "${subject}" (Reply-To: ${replyTo})`);
            if (!emails || emails.length === 0)
                return;
            const unique = [...new Set(emails)];
            for (const to of unique) {
                try {
                    yield (0, EmailService_1.sendEmail)({
                        to,
                        subject,
                        html: body || undefined,
                        text: body || undefined,
                        replyTo: replyTo || undefined
                    });
                }
                catch (err) {
                    console.error(`[CampaignService] sendBulkEmail failed for ${to}:`, (err === null || err === void 0 ? void 0 : err.message) || err);
                }
            }
        });
    }
    /**
     * Adds an email list ID to a campaign's audience.
     * @param campaignId The campaign ID.
     * @param emailListId The email list ID to add.
     * @returns The updated campaign object.
     * @throws ApiError if campaign/list is not found.
     */
    addEmailListToCampaign(campaignId, emailListId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Adding email list ${emailListId} to campaign ${campaignId}`);
            const campaign = mockCampaigns.find(c => c._id === campaignId);
            if (!campaign) {
                return null; // Campaign not found
            }
            // Mock update logic
            campaign.audience.emailLists = campaign.audience.emailLists || [];
            if (!campaign.audience.emailLists.includes(emailListId)) {
                campaign.audience.emailLists.push(emailListId);
            }
            return campaign;
        });
    }
    /**
     * Fetches a campaign and populates its associated email list data.
     * @param id The campaign ID.
     * @returns The campaign with embedded list details, or null if not found.
     */
    getCampaignWithEmailList(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(`Fetching campaign ${id} with email list data`);
            const campaign = mockCampaigns.find(c => c._id === id);
            if (!campaign || !((_a = campaign.audience.emailLists) === null || _a === void 0 ? void 0 : _a[0])) {
                return null;
            }
            const emailListId = campaign.audience.emailLists[0];
            const emailList = mockEmailLists.find(l => l._id === emailListId);
            if (!emailList) {
                // Campaign found, but list reference is broken/missing
                return null;
            }
            return { campaign, emailListDetails: emailList };
        });
    }
    searchCampaigns(userId, query, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = (options === null || options === void 0 ? void 0 : options.limit) || 10;
            const page = (options === null || options === void 0 ? void 0 : options.page) || 1;
            const skip = (page - 1) * limit;
            // Search in MongoDB using text search and filtering
            const searchQuery = {
                user_id: userId,
                $or: [
                    { campaignName: { $regex: query, $options: 'i' } },
                    { subjectLine: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } }
                ]
            };
            // Add status filter if provided
            if (options === null || options === void 0 ? void 0 : options.status) {
                searchQuery.status = options.status;
            }
            try {
                const Campaign = require('../../models/Campaign').Campaign;
                const campaigns = yield Campaign.find(searchQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit);
                const total = yield Campaign.countDocuments(searchQuery);
                return {
                    results: campaigns,
                    total
                };
            }
            catch (error) {
                console.error('Search campaigns error:', error);
                throw new types_1.ApiError(types_1.StatusCodes.NOT_FOUND, "Error searching campaigns");
            }
        });
    }
}
exports.CampaignServiceImpl = CampaignServiceImpl;
