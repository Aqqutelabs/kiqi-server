import { SMCampaignModel } from "../models/SMCampaign";

export interface SMCampaignService {
    createSMCampaign(data: Partial<SMCampaignModel>): Promise<SMCampaignModel>;
    getAllSMCampaigns(): Promise<SMCampaignModel[]>;
    getSMCampaignById(id: string): Promise<SMCampaignModel | null>;
    deleteSMCampaign(id: string): Promise<void>;
}