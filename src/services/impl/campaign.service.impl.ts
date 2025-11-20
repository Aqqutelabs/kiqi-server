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
import axios from 'axios';
import { sendEmail } from "../../utils/EmailService";
import { EmailListModel } from "../../models/EmailList";

// Mock Data Storage for demonstration
const mockCampaigns: Campaign[] = [];
const mockEmailLists: EmailList[] = [{
    _id: "list-123",
    name: "Mock Subscribers",
    user_id: "user-456",
    emails: ["test1@example.com", "test2@example.com"]
}];

/**
 * CampaignServiceImpl contains the business logic for managing email campaigns.
 * All methods are defined as public to be accessible by the CampaignController.
 */
export class CampaignServiceImpl {

    /**
     * Creates a campaign and schedules it for immediate or future sending.
     * @param campaignData The base data for the campaign.
     * @param scheduledAt The date/time to send the campaign.
     * @returns The created campaign and the scheduling job ID.
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
                    console.error('[CampaignService] SendGrid lookup failed for id:', identifier, err?.response?.data || err.message);
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

        const newCampaign: Campaign = {
            _id: `camp-${Date.now()}`,
            ...campaignData,
            status: 'Scheduled',
            createdAt: new Date(),
        } as Campaign;
        
        mockCampaigns.push(newCampaign);

        // Trigger email sending immediately (or queue for later if scheduledAt is in future)
        const isImmediate = scheduledAt <= new Date();
        if (isImmediate) {
            // Send emails now (non-blocking)
            this.sendCampaignEmails(newCampaign).catch(err => 
                console.error(`Error sending campaign ${newCampaign._id}:`, err)
            );
        } else {
            // In production, queue this with a job scheduler (e.g., BullMQ)
            console.log(`Campaign ${newCampaign._id} queued for ${scheduledAt.toISOString()}`);
        }

        return {
            campaign: newCampaign,
            jobId: `job-${newCampaign._id}`
        };
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
            } catch (err: any) {
                console.error('[CampaignService] Pre-send SendGrid verification failed:', err?.response?.data || err?.message || err);
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
                        html: campaign.content?.htmlContent || "<p>Email content</p>",
                        text: campaign.content?.plainText || "Email content",
                        from: fromObject,
                        replyTo: replyToAddress
                    });
                } catch (err) {
                    console.error(`Failed to send to ${recipient}:`, err);
                }
            }

            console.log(`Campaign ${campaign._id} sent successfully`);
        } catch (err) {
            console.error(`Error in sendCampaignEmails:`, err);
            throw err;
        }
    }

    /**
     * Creates a campaign in 'Draft' status.
     * @param campaignData The base data for the campaign.
     * @returns The created campaign object.
     */
    public async createCampaign(campaignData: CampaignData): Promise<Campaign> {
        console.log(`Creating campaign draft: ${campaignData.campaignName}`);
        
        const newCampaign: Campaign = {
            _id: `camp-${Date.now()}`,
            ...campaignData,
            status: 'Draft',
            createdAt: new Date(),
        } as Campaign; // Type assertion needed due to initial interface design

        mockCampaigns.push(newCampaign);
        return newCampaign;
    }

    /**
     * Fetches all campaigns for a specific user ID.
     * @param userId The ID of the authenticated user.
     * @returns An array of campaigns.
     */
    public async getAllCampaigns(userId: string): Promise<Campaign[]> {
        console.log(`Fetching all campaigns for user: ${userId}`);
        // Mock logic: filter mock campaigns by user ID
        return mockCampaigns.filter(c => c.user_id === userId);
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
        const campaign = mockCampaigns.find(c => c._id === id);
        
        if (!campaign || campaign.user_id !== userId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
        }
        return campaign;
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
        const index = mockCampaigns.findIndex(c => c._id === id);

        if (index === -1 || mockCampaigns[index].user_id !== userId) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
        }

        const updatedCampaign = { 
            ...mockCampaigns[index], 
            ...updateData 
        };
        mockCampaigns[index] = updatedCampaign;
        return updatedCampaign;
    }

    /**
     * Deletes a campaign.
     * @param id The campaign ID.
     * @param userId The ID of the authenticated user.
     * @throws ApiError if not found or unauthorized.
     */
    public async deleteCampaign(id: string, userId: string): Promise<void> {
        console.log(`Deleting campaign ID ${id}`);
        const initialLength = mockCampaigns.length;
        const index = mockCampaigns.findIndex(c => c._id === id && c.user_id === userId);
        
        if (index === -1) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found or unauthorized.");
        }
        
        mockCampaigns.splice(index, 1);
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
        const list = mockEmailLists.find(l => l._id === emailListId && l.user_id === userId);
        return list || null;
    }

    /**
     * Mocks the bulk email sending process.
     */
    public async sendBulkEmail(emails: string[], subject: string, body: string, replyTo: string): Promise<void> {
        console.log(`Sending ${emails.length} emails with subject: "${subject}" (Reply-To: ${replyTo})`);
        // Mock successful email sending
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
    }

    /**
     * Fetches a campaign and populates its associated email list data.
     * @param id The campaign ID.
     * @returns The campaign with embedded list details, or null if not found.
     */
    public async getCampaignWithEmailList(id: string): Promise<CampaignWithList | null> {
        console.log(`Fetching campaign ${id} with email list data`);
        const campaign = mockCampaigns.find(c => c._id === id);
        
        if (!campaign || !campaign.audience.emailLists?.[0]) {
            return null;
        }

        const emailListId = campaign.audience.emailLists[0];
        const emailList = mockEmailLists.find(l => l._id === emailListId);

        if (!emailList) {
            // Campaign found, but list reference is broken/missing
            return null; 
        }

        return { campaign, emailListDetails: emailList };
    }
}