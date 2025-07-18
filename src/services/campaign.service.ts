import { CampaignDoc } from "../models/Campaign";

export interface CampaignService{
    createCampaign(data: {campaignName: String, subjectLine: String, campaignType: String}): Promise<CampaignDoc>;
    getAllCampaigns(): Promise<CampaignDoc[]>
}