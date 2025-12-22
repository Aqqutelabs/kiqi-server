import { 
    Campaign, 
    CampaignData, 
    CampaignUpdate, 
    EmailList, 
    ScheduleResponse,
    CampaignWithList,
    ApiError,
    StatusCodes
} from "../types";
import { SenderModel } from "../../models/SenderEmail";
import { CampaignModel } from "../../models/Campaign";
import axios from 'axios';
import { sendEmail } from "../../utils/EmailService";
import { EmailListModel } from "../../models/EmailList";

/**
 * CampaignServiceImpl contains the business logic for managing email campaigns.
 * All methods are defined as public to be accessible by the CampaignController.
 */
export class CampaignServiceImpl {
    // Track campaign errors for debugging on frontend
    private campaignErrors: Map<string, { error: string; timestamp: Date }> = new Map();

    /**
     * Creates a campaign and schedules it for immediate or future sending.
     * @param campaignData The base data for the campaign.
     * @param scheduledAt The date/time to send the campaign.
     * @returns The created campaign and the scheduling job ID, including any sending errors.
     */
    public async createAndScheduleCampaign(
        campaignData: CampaignData,
        scheduledAt: Date
    ): Promise<ScheduleResponse> {
        console.log(`Scheduling campaign '${campaignData.campaignName}' for ${scheduledAt.toISOString()}`);
        
        // Resolve sender: accept local sender _id, a SendGrid sender id, or an email address.
        if (!campaignData.senderId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'senderId (local id, sendgridId, or email) is required to schedule a campaign');
        }

        // Helper: try to resolve a SenderModel by different identifiers
        const resolveSender = async (identifier: string) => {
            // Try local _id first
            try {
                const byId = await SenderModel.findById(identifier as any);
                if (byId) return byId;
            } catch (e) {
                // ignore invalid ObjectId error
            }

            // Try stored sendgridId
            let bySg = await SenderModel.findOne({ sendgridId: identifier });
            if (bySg) return bySg;

            // If identifier looks like an email, search by senderEmail
            if (identifier.includes('@')) {
                const byEmail = await SenderModel.findOne({ senderEmail: identifier.toLowerCase() });
                if (byEmail) return byEmail;
            }

            // If it looks like a SendGrid id (heuristic: contains '-' or starts with 'sg'), try fetching from SendGrid
            const looksLikeSgId = identifier.startsWith('sg_') || identifier.indexOf('-') !== -1;
            if (looksLikeSgId) {
                const key = process.env.SENDGRID_API_KEY;
                if (!key) return null;
                try {
                    const resp = await axios.get(`https://api.sendgrid.com/v3/verified_senders/${encodeURIComponent(identifier)}`, {
                        headers: { Authorization: `Bearer ${key}` }
                    });
                    const body = resp.data || {};
                    const email = body.from_email || body.email || body.from || body.from_email_address;
                    const name = body.from_name || body.from_name || body.nickname || undefined;
                    const isVerified = body.verified === true || body.status === 'verified' || body.is_verified === true;

                    if (email) {
                        // Upsert local sender record so we have it locally for future use
                        let local = await SenderModel.findOne({ senderEmail: email.toLowerCase() });
                        if (!local) {
                            local = await SenderModel.create({ senderName: name || email, type: 'sendgrid', senderEmail: email.toLowerCase(), verified: !!isVerified, sendgridId: identifier });
                        } else {
                            local.sendgridId = identifier as any;
                            local.verified = !!isVerified as any;
                            local.type = 'sendgrid' as any;
                            await local.save();
                        }
                        return local;
                    }
                    } catch (err) {
                    // ignore SendGrid lookup errors here; caller will handle absence
                    const e: any = err;
                    console.error('[CampaignService] SendGrid lookup failed for id:', identifier, e?.response?.data || e?.message || e);
                }
            }

            return null;
        };

        const senderRecord = await resolveSender(String(campaignData.senderId));
        if (!senderRecord || !senderRecord.verified) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Sender email not found or not verified');
        }

        // Ensure campaignData.senderId stores the local sender _id so later sending routines can find it.
        try {
            campaignData.senderId = senderRecord._id as any;
        } catch (e) {
            // ignore if unable to overwrite
        }

        // Create campaign in database with sender details from the resolved sender record
        const newCampaign = new CampaignModel({
            ...campaignData,
            sender: {
                senderName: senderRecord.senderName || '',
                senderEmail: senderRecord.senderEmail,
                replyToEmail: senderRecord.senderEmail
            },
            status: 'Scheduled',
            createdAt: new Date(),
        });
        const savedCampaign = await newCampaign.save();
        const campaignDoc = savedCampaign.toObject() as unknown as Campaign;

        // Trigger email sending immediately (or queue for later if scheduledAt is in future)
        const isImmediate = scheduledAt <= new Date();
        let sendingError: string | null = null;

        if (isImmediate) {
            // Send emails now (non-blocking but capture errors)
            try {
                await this.sendCampaignEmails(campaignDoc);
            } catch (err: unknown) {
                const e: any = err;
                sendingError = e?.message || String(e) || 'Unknown error while sending campaign';
                console.error(`Error sending campaign ${campaignDoc._id}:`, err);
            }
        } else {
            // In production, queue this with a job scheduler (e.g., BullMQ)
            console.log(`Campaign ${campaignDoc._id} queued for ${scheduledAt.toISOString()}`);
        }

        const response: any = {
            campaign: campaignDoc,
            jobId: `job-${campaignDoc._id}`
        };

        // Include error in response if one occurred
        if (sendingError) {
            response.sendingError = sendingError;
            this.campaignErrors.set(campaignDoc._id, {
                error: sendingError,
                timestamp: new Date()
            });
        }

        return response;
    }

    /**
     * Sends campaign emails to all recipients in the audience.
     * @param campaign The campaign to send.
     */
    private async sendCampaignEmails(campaign: Campaign): Promise<void> {
        try {
            console.log(`Sending emails for campaign ${campaign._id}...`);
            
            const recipients: string[] = [];

            // Get emails from email lists
            if (campaign.audience?.emailLists && campaign.audience.emailLists.length > 0) {
                for (const listId of campaign.audience.emailLists) {
                    const emailList = await EmailListModel.findById(listId);
                    if (emailList && emailList.emails) {
                        const emails = emailList.emails.map((e: any) => 
                            typeof e === "string" ? e : e?.email
                        ).filter(Boolean);
                        recipients.push(...emails);
                    }
                }
            }

            // Add manual emails
            if (campaign.audience?.manualEmails && campaign.audience.manualEmails.length > 0) {
                recipients.push(...campaign.audience.manualEmails);
            }

            // Remove duplicates
            const uniqueRecipients = [...new Set(recipients)];

            console.log(`Sending campaign to ${uniqueRecipients.length} recipients`);

            // Determine 'from' address from senderId (must be verified)
            let fromAddress = process.env.EMAIL_FROM;
            let replyToAddress: string | undefined = undefined;
            let fromObject: any = fromAddress;
            let resolvedSendgridId: string | undefined = undefined;
            if ((campaign as any).senderId) {
                const senderRec = await SenderModel.findById((campaign as any).senderId as any);
                if (senderRec && senderRec.verified) {
                    // Use the verified sender's email (and name) as the 'from' address
                    fromObject = { email: senderRec.senderEmail as any, name: senderRec.senderName as any };
                    resolvedSendgridId = senderRec.sendgridId as any;
                }
            }

            // Pre-send verification: ensure SendGrid shows this sender as verified to avoid 403 at send time
            try {
                const key = process.env.SENDGRID_API_KEY;
                if (key && fromObject && typeof fromObject === 'object' && fromObject.email) {
                    // Use the list endpoint to find and verify the sender by email
                    const listResp = await axios.get('https://api.sendgrid.com/v3/verified_senders', {
                        headers: { Authorization: `Bearer ${key}` }
                    });
                    const listBody = listResp.data || {};
                    const results = Array.isArray(listBody.result) ? listBody.result : (Array.isArray(listBody) ? listBody : listBody.results || []);
                    const match = results.find((e: any) => {
                        const entryEmail = e.from_email || e.from_email_address || e.email || e.from;
                        return entryEmail && String(entryEmail).toLowerCase() === String(fromObject.email).toLowerCase();
                    });
                    if (!match) {
                        throw new ApiError(StatusCodes.BAD_REQUEST, `No verified SendGrid sender found for email ${fromObject.email}`);
                    }
                    const isVerified = match.verified === true || match.status === 'verified' || match.is_verified === true;
                    if (!isVerified) {
                        throw new ApiError(StatusCodes.BAD_REQUEST, `SendGrid sender for email ${fromObject.email} is not verified`);
                    }
                    // store sendgrid id locally if present
                    const sgId = match.id || match._id || match.sender_id;
                    if (sgId) {
                        resolvedSendgridId = sgId;
                        const local = await SenderModel.findOne({ senderEmail: String(fromObject.email).toLowerCase() });
                        if (local) {
                            local.sendgridId = String(sgId) as any;
                            local.verified = true as any;
                            await local.save();
                        }
                    }
                }
            } catch (err: unknown) {
                const e: any = err;
                console.error('[CampaignService] Pre-send SendGrid verification failed:', e?.response?.data || e?.message || e);
                throw err;
            }

            // Send to each recipient
            for (const recipient of uniqueRecipients) {
                    try {
                        // Debug: print resolved from and SendGrid sender id (dev-only)
                        if (process.env.NODE_ENV !== 'production') {
                            try {
                                console.log(`[Email][Debug] campaign=${campaign._id} to=${recipient} from=${JSON.stringify(fromObject)} sendgridId=${resolvedSendgridId}`);
                            } catch (dbgErr) {
                                console.log('[Email][Debug] failed to stringify fromObject', dbgErr);
                            }
                        }
                    await sendEmail({
                        to: recipient,
                        subject: campaign.subjectLine,
                        html: (campaign as any).content?.htmlContent || "<p>Email content</p>",
                        text: (campaign as any).content?.plainText || "Email content",
                        from: fromObject,
                        replyTo: replyToAddress
                    });
                } catch (err) {
                    console.error(`Failed to send to ${recipient}:`, err);
                }
            }

            console.log(`Campaign ${campaign._id} sent successfully`);
        } catch (err: unknown) {
            const e: any = err;
            console.error(`Error in sendCampaignEmails:`, e?.message || e);
            throw err;
        }
    }

    /**
     * Update simple campaign analytics counters (deliveries, bounces).
     * This is a lightweight in-memory implementation for the mock service used in tests and local runs.
     */
    public async updateCampaignAnalytics(campaignId: string, metric: 'deliveries' | 'bounces' | string, delta = 1): Promise<void> {
        try {
            const campaign = await CampaignModel.findById(campaignId);
            if (!campaign) return;
            
            campaign.analytics = campaign.analytics || { deliveries: 0, bounces: 0 };
            const key = metric as 'deliveries' | 'bounces' | string;
            if (typeof (campaign.analytics as any)[key] !== 'number') (campaign.analytics as any)[key] = 0;
            (campaign.analytics as any)[key] += delta;
            await campaign.save();
        } catch (error) {
            console.error(`Error updating campaign analytics: ${error}`);
        }
    }

    /**
     * Creates a campaign in 'Draft' status.
     * @param campaignData The base data for the campaign.
     * @returns The created campaign object.
     */
    public async createCampaign(campaignData: CampaignData): Promise<Campaign> {
        console.log(`Creating campaign draft: ${campaignData.campaignName}`);
        
        const newCampaign = new CampaignModel({
            ...campaignData,
            status: 'Draft',
            createdAt: new Date(),
        });

        const savedCampaign = await newCampaign.save();
        return savedCampaign.toObject() as unknown as Campaign;
    }

    /**
     * Fetches all campaigns for a specific user ID.
     * @param userId The ID of the authenticated user.
     * @returns An array of campaigns.
     */
    public async getAllCampaigns(userId: string): Promise<Campaign[]> {
        console.log(`Fetching all campaigns for user: ${userId}`);
        const campaigns = await CampaignModel.find({ user_id: userId });
        return campaigns.map(c => c.toObject() as unknown as Campaign);
    }

    /**
     * Fetches a single campaign by ID, ensuring ownership.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @returns The campaign object.
     * @throws ApiError if not found or unauthorized.
     */
    public async getCampaignById(id: string, userId: string): Promise<Campaign> {
        console.log(`Fetching campaign ID ${id} for user ${userId}`);
        const campaign = await CampaignModel.findById(id);
        
        if (!campaign || campaign.user_id.toString() !== userId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
        }
        return campaign.toObject() as unknown as Campaign;
    }

    /**
     * Updates fields of a campaign.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @param updateData The fields to update.
     * @returns The updated campaign object.
     * @throws ApiError if not found or unauthorized.
     */
    public async updateCampaign(id: string, userId: string, updateData: CampaignUpdate): Promise<Campaign> {
        console.log(`Updating campaign ID ${id}`);
        const campaign = await CampaignModel.findById(id);

        if (!campaign || campaign.user_id.toString() !== userId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
        }

        Object.assign(campaign, updateData);
        const updatedCampaign = await campaign.save();
        return updatedCampaign.toObject() as unknown as Campaign;
    }

    /**
     * Retrieves any error that occurred during campaign sending.
     * @param campaignId The campaign ID.
     * @returns The error object if one exists, null otherwise.
     */
    public getCampaignError(campaignId: string): { error: string; timestamp: Date } | null {
        return this.campaignErrors.get(campaignId) || null;
    }

    /**
     * Updates advanced email settings for a campaign.
     * @param campaignId The campaign ID.
     * @param userId The user ID for authorization.
     * @param settings The advanced email settings.
     * @returns The updated campaign.
     */
    public async updateAdvancedSettings(
        campaignId: string,
        userId: string,
        settings: any
    ): Promise<any> {
        const campaign = await CampaignModel.findById(campaignId);
        
        if (!campaign || campaign.user_id.toString() !== userId) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign not found');
        }

        campaign.advancedSettings = settings;
        const updated = await campaign.save();
        return updated.toObject();
    }

    /**
     * Deletes a campaign.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @throws ApiError if not found or unauthorized.
     */
    public async deleteCampaign(id: string, userId: string): Promise<void> {
        console.log(`Deleting campaign ID ${id}`);
        const result = await CampaignModel.deleteOne({ _id: id, user_id: userId });
        
        if (result.deletedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
        }
        
        console.log(`Successfully deleted campaign ID ${id}.`);
    }

    /**
     * Fetches an email list, ensuring it belongs to the user.
     * @param emailListId The email list ID.
     * @param userId The ID of the authenticated user.
     * @returns The EmailList object or null if not found.
     */
    public async getEmailListForUser(emailListId: string, userId: string): Promise<EmailList | null> {
        console.log(`Fetching email list ${emailListId} for user ${userId}`);
        const list = await EmailListModel.findOne({ _id: emailListId, user_id: userId });
        return list ? (list.toObject() as unknown as EmailList) : null;
    }

    /**
     * Mocks the bulk email sending process.
     */
    public async sendBulkEmail(emails: string[], subject: string, body: string, replyTo: string): Promise<void> {
        console.log(`Sending ${emails.length} emails with subject: "${subject}" (Reply-To: ${replyTo})`);
        if (!emails || emails.length === 0) return;
        const unique = [...new Set(emails)];
        for (const to of unique) {
            try {
                await sendEmail({
                    to,
                    subject,
                    html: body || undefined,
                    text: body || undefined,
                    replyTo: replyTo || undefined
                });
            } catch (err) {
                console.error(`[CampaignService] sendBulkEmail failed for ${to}:`, (err as any)?.message || err);
            }
        }
    }

    /**
     * Adds an email list ID to a campaign's audience.
     * @param campaignId The campaign ID.
     * @param emailListId The email list ID to add.
     * @returns The updated campaign object.
     * @throws ApiError if campaign/list is not found.
     */
    public async addEmailListToCampaign(campaignId: string, emailListId: string): Promise<Campaign | null> {
        console.log(`Adding email list ${emailListId} to campaign ${campaignId}`);
        
        const campaign = await CampaignModel.findById(campaignId);
        if (!campaign) {
            return null; // Campaign not found
        }
        
        campaign.audience.emailLists = campaign.audience.emailLists || [];
        if (!campaign.audience.emailLists.some(id => String(id) === String(emailListId))) {
            campaign.audience.emailLists.push(emailListId as any);
        }
        
        const updated = await campaign.save();
        return updated.toObject() as unknown as Campaign;
    }

    /**
     * Fetches a campaign and populates its associated email list data.
     * @param id The campaign ID.
     * @returns The campaign with embedded list details, or null if not found.
     */
    public async getCampaignWithEmailList(id: string): Promise<CampaignWithList | null> {
        console.log(`Fetching campaign ${id} with email list data`);
        const campaign = await CampaignModel.findById(id);
        
        if (!campaign || !campaign.audience.emailLists?.[0]) {
            return null;
        }

        const emailListId = campaign.audience.emailLists[0];
        const emailList = await EmailListModel.findById(emailListId);

        if (!emailList) {
            // Campaign found, but list reference is broken/missing
            return null; 
        }

        return { campaign: campaign.toObject() as unknown as Campaign, emailListDetails: emailList.toObject() as unknown as EmailList };
    }

    public async searchCampaigns(
        userId: string,
        query: string,
        options?: { status?: string; limit?: number; page?: number }
    ): Promise<{ results: any[]; total: number }> {
        const limit = options?.limit || 10;
        const page = options?.page || 1;
        const skip = (page - 1) * limit;

        // Search in MongoDB using text search and filtering
        const searchQuery: any = {
            user_id: userId,
            $or: [
                { campaignName: { $regex: query, $options: 'i' } },
                { subjectLine: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        };

        // Add status filter if provided
        if (options?.status) {
            searchQuery.status = options.status;
        }

        try {
            const Campaign = require('../../models/Campaign').Campaign;
            
            const campaigns = await Campaign.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Campaign.countDocuments(searchQuery);

            return {
                results: campaigns,
                total
            };
        } catch (error) {
            console.error('Search campaigns error:', error);
            throw new ApiError(StatusCodes.NOT_FOUND, "Error searching campaigns");
        }
    }
}