import { SMCampaignModel } from "../../models/SMCampaign";
import { SMCampaignService } from "../smCampaign.service";

export class SMCampaignImpl implements SMCampaignService {    
    async createSMCampaign(data: Partial<SMCampaignModel>): Promise<SMCampaignModel> {
        const campaign = await SMCampaignModel.create(data);
        return campaign;
    }

    async getAllSMCampaigns(): Promise<SMCampaignModel[]> {
        return SMCampaignModel.find();
    }

    async getSMCampaignById(id: string): Promise<SMCampaignModel | null> {
        return SMCampaignModel.findById(id);
    }

    async deleteSMCampaign(id: string): Promise<void> {
        await SMCampaignModel.findByIdAndDelete(id);
    }

}