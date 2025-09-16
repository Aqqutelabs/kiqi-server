import { StatusCodes } from "http-status-codes";
import { CampaignDoc, CampaignModel } from "../../models/Campaign";
import { ApiError } from "../../utils/ApiError";
import { CampaignService } from "../campaign.service";

export class CampaignServiceImpl implements CampaignService{
    async createCampaign(data: { campaignName: String; subjectLine: String; status?: string; userId?: string; emailListIds?: string[]; senderEmail?: string; deliveryStatus?: string; category?: string; campaignTopic?: string; instructions?: any[]; reward?: string; startDate?: Date; endDate?: Date; time?: Date; }): Promise<CampaignDoc> {
        const isCampaignExists = await CampaignModel.findOne({
            campaignName: data.campaignName
        })
        

        const campaign = await CampaignModel.create({
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
        })

        return campaign;
    }
    async getAllCampaigns(): Promise<CampaignDoc[]> {
        return CampaignModel.find().populate('emailListIds');
    }
    async getCampaignById(id: String): Promise<CampaignDoc | null> {
        return CampaignModel.findById(id).populate('emailListIds');
    }
    async updateCampaign(id: String, data: Partial<{campaignName: String, subjectLine: String, campaignType: String}>): Promise<CampaignDoc> {
        const updated = await CampaignModel.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
                runValidators: true,
                updatedAt: Date.now()
            });

            if(!updated){
                throw new Error("Campaign not found or updated")
            }
            return updated;
    }
    async deleteCampaign(id: String): Promise<void> {
       await CampaignModel.findByIdAndDelete(id)
    }
    async sendCampaign(id: String): Promise<CampaignDoc> {
        throw new Error("Method not implemented.");
    }
    async scheduleCampaign(id: String): Promise<CampaignDoc> {
        // const campaignId = await CampaignModel.findById(id)
        throw new Error("Method not implemented."); 
    }
    async getCampaignDeliveryStatus(): Promise<CampaignDoc> {
        throw new Error("Method not implemented.");
    }
    async getEmailListForUser(emailListId: string, userId: string) {
        const EmailListModel = require("../../models/EmailList").EmailListModel;
        return EmailListModel.findOne({ _id: emailListId, userId });
    }
    async sendBulkEmail(emails: any[], subject: string, body: string, senderEmail?: string) {
        const { sendEmail } = require("../../utils/EmailService");
        for (const entry of emails) {
            const to = entry.email || entry;
            await sendEmail({
                to,
                subject,
                text: body,
                html: body,
                from: senderEmail
            });
        }
   }
    // Add an email list to a campaign
    async addEmailListToCampaign(campaignId: string, emailListId: string) {
        const campaign = await CampaignModel.findById(campaignId);
        if (!campaign) return null;
        (campaign as any).emailListId = emailListId;
        await campaign.save();
        return campaign;
    }

    // Fetch a campaign and its associated email list data
    async getCampaignWithEmailList(campaignId: string) {
        return CampaignModel.findById(campaignId).populate('emailListId');
    }
}