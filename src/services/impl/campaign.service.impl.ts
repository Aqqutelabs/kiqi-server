import { StatusCodes } from "http-status-codes";
import { CampaignDoc, CampaignModel } from "../../models/Campaign";
import { ApiError } from "../../utils/ApiError";
import { CampaignService } from "../campaign.service";

export class CampaignServiceImpl implements CampaignService{
    async createCampaign(data: { campaignName: String; subjectLine: String; campaignType: String; }): Promise<CampaignDoc> {
        const isCampaignExists = await CampaignModel.findOne({
            campaignName: data.campaignName
        })
        if(isCampaignExists) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Campaign already exists.")
        }

        const campaign = await CampaignModel.create({
            campaignName: data.campaignName,
            campaignType: data.campaignType,
            subjectLine: data.subjectLine,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        return campaign;
    }
    async getAllCampaigns(): Promise<CampaignDoc[]> {
        return CampaignModel.find();
    }
    async getCampaignById(id: String): Promise<CampaignDoc | null> {
        return CampaignModel.findById(id)
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
        const campaignId = await CampaignModel.findById(id) 
    }
    async getCampaignDeliveryStatus(): Promise<CampaignDoc> {
        throw new Error("Method not implemented.");
    }
    
}