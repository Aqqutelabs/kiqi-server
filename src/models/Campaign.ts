import mongoose, { Schema } from "mongoose";

export interface CampaignDoc extends Document{
    _id: string;
    campaignName: string;
    subjectLine: string;
    campaignType?: string;
    status: "Active" | "Scheduled" | "Completed" | "Pending";
    deliveryStatus: string;
}

const CampaignSchema: Schema = new Schema<CampaignDoc>({
    campaignName: { type: String, required: true},
    subjectLine: { type: String, required: true},
    campaignType: { type: String, required: false },
    status: { type: String, required: true }
})

export const CampaignModel = mongoose.model<CampaignDoc>("Campaign", CampaignSchema)