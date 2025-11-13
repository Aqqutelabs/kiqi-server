import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { 
  CampaignDoc, 
  CampaignStatus, 
  CampaignModel 
} from "../../models/Campaign";
import { EmailListModel } from "../../models/EmailList";
import { ApiError } from "../../utils/ApiError";
import { 
  CampaignService, 
  CampaignFilters, 
  CampaignAnalytics, 
  DashboardMetrics,
  CreateCampaignDto,
  UpdateCampaignDto
} from "../campaign.service";
import { validateEmail } from "../../utils/validator";
import { sendEmail } from "../../utils/EmailService";
import { queueService } from "../queue.service";

export class CampaignServiceImpl implements CampaignService {
  private validateCampaignAccess(campaign: CampaignDoc, userId: string): void {
    if (campaign.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You don't have access to this campaign");
    }
  }

  async createCampaign(data: CreateCampaignDto): Promise<CampaignDoc> {
    // Import SenderModel to validate sender
    const { SenderModel } = require("../../models/SenderEmail");

    // Validate senderId is provided
    const senderId = (data as any).senderId;
    if (!senderId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "senderId is required");
    }

    // Look up the sender and verify it's verified
    const sender = await SenderModel.findById(senderId);
    if (!sender) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Sender email not found");
    }

    if (!sender.verified) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Sender email is not verified. Please verify the sender first.");
    }

    // Check for existing campaign
    const existingCampaign = await CampaignModel.findOne({
      user_id: new mongoose.Types.ObjectId(data.user_id),
      campaignName: data.campaignName
    });
    
    if (existingCampaign) {
      throw new ApiError(StatusCodes.CONFLICT, "A campaign with this name already exists");
    }
    
    const campaign = await CampaignModel.create({
      user_id: new mongoose.Types.ObjectId(data.user_id),
      campaignName: data.campaignName,
      subjectLine: data.subjectLine,
      campaignType: "Newsletter", // Default type
      status: "Draft",
      // Populate sender info from verified SenderEmail record
      sender: {
        senderName: sender.senderName || "Default Sender",
        senderEmail: sender.senderEmail,
        replyToEmail: sender.senderEmail // Use same email as reply-to
      },
      // Provide empty content structure (user will add content later)
      content: {
        htmlContent: "<p>Email content will be added here</p>",
        plainText: "Email content will be added here"
      },
      // Provide default structures for required nested fields
      audience: {
        emailLists: [],
        excludeLists: [],
        manualEmails: []
      },
      resendSettings: {
        enabled: false,
        waitTime: 48,
        condition: "Unopened"
      },
      smartSettings: {
        fallbacks: {
          firstName: "there",
          lastName: "",
          custom: {}
        },
        sendLimits: {
          dailyLimit: 5000,
          batchSize: 500,
          batchInterval: 10
        },
        compliance: {
          includeUnsubscribe: true,
          includePermissionReminder: true,
          reminderText: "You're receiving this email because you subscribed to our mailing list"
        },
        footer: {
          style: "default",
          customText: ""
        },
        optimization: {
          smartTimeEnabled: false,
          predictCTR: false
        }
      },
      schedule: {
        useRecipientTimezone: false
      },
      analytics: {
        deliveries: 0,
        opens: 0,
        clicks: 0,
        unsubscribes: 0,
        bounces: 0,
        complaints: 0,
        lastUpdated: new Date()
      },
      metadata: {
        aiGenerated: false,
        tags: []
      }
    });

    return campaign;
  }

  async createAndScheduleCampaign(
    data: CreateCampaignDto,
    scheduledDate: Date
  ): Promise<{ campaign: CampaignDoc; jobId: string }> {
    // First, create the campaign in Draft status
    const campaign = await this.createCampaign(data);

    // Then schedule it to start at the specified time
    const isImmediate = scheduledDate <= new Date();
    const status = isImmediate ? "Active" : "Scheduled";

    const updated = await CampaignModel.findByIdAndUpdate(
      campaign._id,
      {
        status,
        "schedule.scheduledDate": scheduledDate,
        ...(isImmediate ? { startedAt: new Date() } : {}),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update campaign schedule");
    }

    // Queue the campaign start (this would integrate with your job queue)
    // For now, return a mock jobId. In production, integrate with BullMQ or similar.
    let jobId = "";
    try {
      if (queueService && typeof (queueService as any).scheduleCampaign === "function") {
        jobId = await (queueService as any).scheduleCampaign(campaign._id, scheduledDate);
      } else {
        // Fallback: generate a simple jobId for tracking
        jobId = `job_${campaign._id}_${Date.now()}`;
      }
    } catch (error) {
      console.warn("Queue service unavailable, using fallback jobId:", error);
      jobId = `job_${campaign._id}_${Date.now()}`;
    }

    return { campaign: updated, jobId };
  }

  async getCampaigns(userId: string, filters?: CampaignFilters): Promise<CampaignDoc[]> {
    const query: Record<string, any> = { userId: new mongoose.Types.ObjectId(userId) };

    if (filters) {
      if (filters.status?.length) query.status = { $in: filters.status };
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }
      if (filters.tags?.length) query["metadata.tags"] = { $in: filters.tags };
      if (filters.searchTerm) query.$text = { $search: filters.searchTerm };
    }

    return CampaignModel.find(query)
      .populate("audience.emailLists")
      .populate("audience.excludeLists")
      .sort({ createdAt: -1 });
  }

  private async validateEmailListsAccess(listIds: string[], userId: string): Promise<void> {
    const lists = await EmailListModel.find({
      _id: { $in: listIds },
      userId
    });

    if (lists.length !== listIds.length) {
      throw new ApiError(StatusCodes.FORBIDDEN, "You don't have access to one or more email lists");
    }
  }

  async getCampaignById(id: string, userId: string): Promise<CampaignDoc> {
    const campaign = await CampaignModel.findById(id)
      .populate("audience.emailLists")
      .populate("audience.excludeLists");

    if (!campaign) throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");
    this.validateCampaignAccess(campaign, userId);
    return campaign;
  }

  async updateCampaign(id: string, userId: string, data: UpdateCampaignDto): Promise<CampaignDoc> {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.status === "Active") {
      const forbiddenFields = ["audience", "content", "smartSettings"];
      if (forbiddenFields.some(field => field in data)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot update audience, content, or smart settings while campaign is active");
      }
    }

    if (data.audience?.emailLists?.length)
      await this.validateEmailListsAccess(data.audience.emailLists, userId);
    if (data.audience?.excludeLists?.length)
      await this.validateEmailListsAccess(data.audience.excludeLists, userId);

    const updated = await CampaignModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate(["audience.emailLists", "audience.excludeLists"]);

    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");
    return updated;
  }

  async updateCampaignStatus(id: string, userId: string, status: CampaignStatus): Promise<CampaignDoc> {
    const campaign = await this.getCampaignById(id, userId);

    switch (status as any) {
      case "Active":
        if (!["Draft", "Paused"].includes(campaign.status))
          throw new ApiError(StatusCodes.BAD_REQUEST, "Campaign can only be activated from Draft or Paused");
        if (!campaign.content || !campaign.audience)
          throw new ApiError(StatusCodes.BAD_REQUEST, "Campaign must have content and audience before activation");
        break;
      case "Paused":
        if (campaign.status !== "Active")
          throw new ApiError(StatusCodes.BAD_REQUEST, "Only active campaigns can be paused");
        break;
      case "Completed":
        if (campaign.status !== "Active")
          throw new ApiError(StatusCodes.BAD_REQUEST, "Only active campaigns can be completed");
        break;
      case "Cancelled":
        if (campaign.status === "Completed")
          throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot cancel a completed campaign");
        break;
    }

    const updated = await CampaignModel.findByIdAndUpdate(
      id,
      {
        status,
        updatedAt: new Date(),
        ...(status === "Active" ? { startedAt: new Date() } : {}),
        ...(status === "Completed" ? { completedAt: new Date() } : {})
      },
      { new: true, runValidators: true }
    ).populate(["audience.emailLists", "audience.excludeLists"]);

    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");
    return updated;
  }

  async deleteCampaign(id: string, userId: string): Promise<void> {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.status === "Active") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot delete an active campaign. Please cancel it first.");
    }

    await CampaignModel.findByIdAndDelete(id);
  }

  async updateCampaignAnalytics(id: string, type: keyof CampaignDoc["analytics"], increment = 1): Promise<void> {
    const campaign = await CampaignModel.findById(id);
    if (!campaign) throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");

    const update: Record<string, any> = {
      [`analytics.${type}`]: (typeof campaign.analytics?.[type] === "number" ? campaign.analytics[type] : 0) + increment,
      "analytics.lastUpdated": new Date()
    };

    await CampaignModel.findByIdAndUpdate(id, { $set: update });
  }

  async sendCampaign(id: string, userId: string): Promise<CampaignDoc> {
    const campaign = await this.getCampaignById(id, userId);
    if (campaign.status !== "Active") throw new ApiError(StatusCodes.BAD_REQUEST, "Campaign must be active to send emails");

    const recipientEmails: string[] = [];

    if (campaign.audience.emailLists?.length) {
      const lists = await EmailListModel.find({ _id: { $in: campaign.audience.emailLists } });
      for (const list of lists) {
        const emails = list.emails ?? [];
        // Support both string emails and objects like { email: string, name?: string }
        const normalized = emails
          .map((e: any) => (typeof e === "string" ? e : e?.email))
          .filter(Boolean) as string[];
        recipientEmails.push(...normalized);
      }
    }

    if (campaign.audience.manualEmails?.length) recipientEmails.push(...campaign.audience.manualEmails);

    if (campaign.audience.excludeLists?.length) {
      const excludeLists = await EmailListModel.find({ _id: { $in: campaign.audience.excludeLists } });
      // Normalize exclude emails to plain strings (support both string entries and { email, name } objects)
      const excludeEmails = new Set(
        excludeLists.flatMap(list =>
          (list.emails ?? []).map((e: any) => (typeof e === "string" ? e : e?.email)).filter(Boolean)
        )
      );
      const filtered = recipientEmails.filter(email => !excludeEmails.has(email));
      recipientEmails.length = 0;
      recipientEmails.push(...filtered);
    }

    try {
      await queueService.addCampaign(campaign, recipientEmails);
      await this.updateCampaignStatus(id, userId, "Active");
      return this.getCampaignById(id, userId);
    } catch (error) {
      console.error("Failed to queue campaign:", error);
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Failed to queue campaign: ${(error as Error).message || "Unknown error"}`);
    }
  }

  async scheduleCampaign(id: string, userId: string, scheduledDate: Date): Promise<CampaignDoc> {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.status !== "Draft")
      throw new ApiError(StatusCodes.BAD_REQUEST, "Only draft campaigns can be scheduled");

    if (scheduledDate <= new Date())
      throw new ApiError(StatusCodes.BAD_REQUEST, "Scheduled date must be in the future");

    const updated = await CampaignModel.findByIdAndUpdate(
      id,
      { scheduledDate, status: "Scheduled", updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate(["audience.emailLists", "audience.excludeLists"]);

    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");
    return updated;
  }

  async pauseCampaign(id: string, userId: string): Promise<CampaignDoc> {
    return this.updateCampaignStatus(id, userId, "Paused");
  }

  async resumeCampaign(id: string, userId: string): Promise<CampaignDoc> {
    return this.updateCampaignStatus(id, userId, "Active");
  }

  async getCampaignAnalytics(id: string, userId: string): Promise<CampaignAnalytics> {
    const campaign = await this.getCampaignById(id, userId);

    const { deliveries, opens, clicks, bounces, complaints } = campaign.analytics || {};

    return {
      ...campaign.analytics,
      engagementRate: deliveries ? (opens / deliveries) * 100 : 0,
      clickThroughRate: opens ? (clicks / opens) * 100 : 0,
      bounceRate: deliveries ? (bounces / deliveries) * 100 : 0,
      complaintRate: deliveries ? (complaints / deliveries) * 100 : 0
    };
  }

  async getDashboardMetrics(userId: string, startDate?: Date, endDate?: Date): Promise<DashboardMetrics> {
    const query: Record<string, any> = { userId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const campaigns = await CampaignModel.find(query);

    const metrics: DashboardMetrics = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === "Active").length,
      completedCampaigns: campaigns.filter(c => c.status === "Completed").length,
      totalDeliveries: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalBounces: 0,
      totalComplaints: 0,
      averageEngagementRate: 0,
      averageClickThroughRate: 0
    };

    campaigns.forEach(campaign => {
      metrics.totalDeliveries += campaign.analytics?.deliveries ?? 0;
      metrics.totalOpens += campaign.analytics?.opens ?? 0;
      metrics.totalClicks += campaign.analytics?.clicks ?? 0;
      metrics.totalBounces += campaign.analytics?.bounces ?? 0;
      metrics.totalComplaints += campaign.analytics?.complaints ?? 0;
    });

    if (metrics.totalDeliveries > 0)
      metrics.averageEngagementRate = (metrics.totalOpens / metrics.totalDeliveries) * 100;
    if (metrics.totalOpens > 0)
      metrics.averageClickThroughRate = (metrics.totalClicks / metrics.totalOpens) * 100;

    return metrics;
  }

  async getCampaignDeliveryStatus(id: string, userId: string): Promise<{ status: CampaignStatus; details: any }> {
    const campaign = await this.getCampaignById(id, userId);
    return {
      status: campaign.status,
      details: {
        deliveredCount: campaign.analytics.deliveries,
        pendingCount: 0,
        failedCount: campaign.analytics.bounces,
        lastUpdated: campaign.analytics.lastUpdated
      }
    };
  }

  async getCampaignByEmailListId(emailListId: string, userId: string): Promise<CampaignDoc[]> {
    return CampaignModel.find({ userId, "audience.emailLists": emailListId })
      .populate(["audience.emailLists", "audience.excludeLists"]);
  }

  async getCampaignWithEmailList(campaignId: string): Promise<CampaignDoc | null> {
    return CampaignModel.findById(campaignId)
      .populate(["audience.emailLists", "audience.excludeLists"]);
  }

  async getAudienceSize(id: string, userId: string): Promise<number> {
    const campaign = await this.getCampaignById(id, userId);
    const emailLists = campaign.audience.emailLists || [];
    const manualEmails = campaign.audience.manualEmails || [];

    let audienceSize = manualEmails.length;

    if (emailLists.length) {
      const lists = await EmailListModel.find({ _id: { $in: emailLists } });
      audienceSize += lists.reduce((total, list) => total + (list.emails?.length || 0), 0);
    }

    return audienceSize;
  }

  async previewAudience(id: string, userId: string, limit = 10): Promise<string[]> {
    const campaign = await this.getCampaignById(id, userId);
    const emailLists = campaign.audience.emailLists || [];
    const manualEmails = campaign.audience.manualEmails || [];

    const audience = new Set(manualEmails);

    if (emailLists.length) {
      const lists = await EmailListModel.find({ _id: { $in: emailLists } });
      lists.forEach(list => {
        list.emails
          ?.slice(0, limit - audience.size)
          .forEach((e: any) => {
            const addr = typeof e === "string" ? e : e?.email;
            if (addr) audience.add(addr);
          });
      });
    }

    return Array.from(audience).slice(0, limit);
  }

  async validateCampaign(id: string, userId: string): Promise<{ isValid: boolean; errors?: string[] }> {
    const campaign = await this.getCampaignById(id, userId);
    const errors: string[] = [];

    if (!campaign.content?.htmlContent || !campaign.content?.plainText) {
      errors.push("Campaign content is incomplete.");
    }

    if (!campaign.audience?.emailLists?.length && !campaign.audience?.manualEmails?.length) {
      errors.push("Audience is not defined.");
    }

    return { isValid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  async duplicateCampaign(id: string, userId: string, newName: string): Promise<CampaignDoc> {
    const campaign = await this.getCampaignById(id, userId);

    const duplicate = await CampaignModel.create({
      ...campaign.toObject(),
      _id: undefined,
      campaignName: newName,
      status: "Draft",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return duplicate;
  }

  async sendTestEmail(id: string, userId: string, testEmails: string[]): Promise<void> {
    const campaign = await this.getCampaignById(id, userId);

    if (!campaign.content?.htmlContent || !campaign.content?.plainText) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Campaign content is incomplete.");
    }

    for (const email of testEmails) {
      if (!validateEmail(email)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid test email: ${email}`);
      }
    }

    await Promise.all(
      testEmails.map(email =>
        sendEmail({
          to: email,
          subject: campaign.subjectLine,
          html: campaign.content.htmlContent,
          text: campaign.content.plainText,
          from: campaign.sender.senderEmail
        })
      )
    );
  }
}
