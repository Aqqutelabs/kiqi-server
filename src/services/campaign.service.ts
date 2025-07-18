import { CampaignDoc } from "../models/Campaign";

export interface CampaignService{
    createCampaign(data: {campaignName: String, subjectLine: String, campaignType: String}): Promise<CampaignDoc>;
    getAllCampaigns(): Promise<CampaignDoc[]>
    getCampaignById(id: String): Promise<CampaignDoc>
    updateCampaign(id: String): Promise<CampaignDoc>
    deleteCampaign(id: String): Promise<void>
    sendCampaign(): Promise<CampaignDoc>
    scheduleCampaign(): Promise<CampaignDoc>
    getCampaignDeliveryStatus(): Promise<CampaignDoc>
}