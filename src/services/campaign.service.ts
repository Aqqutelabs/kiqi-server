import { CampaignDoc } from "../models/Campaign";

export interface CampaignService{
    createCampaign(data: {campaignName: String, subjectLine: String, campaignType: String}): Promise<CampaignDoc>;
    getAllCampaigns(): Promise<CampaignDoc[]>
    getCampaignById(id: String): Promise<CampaignDoc | null>
    updateCampaign(id: String, data: Partial<{campaignName: String, subjectLine: String, campaignType: String }>): Promise<CampaignDoc>
    deleteCampaign(id: String): Promise<void>
    sendCampaign(id: String): Promise<CampaignDoc>
    scheduleCampaign(id: String): Promise<CampaignDoc>
    getCampaignDeliveryStatus(): Promise<CampaignDoc>
}
