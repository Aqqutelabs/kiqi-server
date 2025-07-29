import mongoose, { Schema, Document } from "mongoose";

export interface CampaignDoc extends Document {
  _id: string;
  campaignName: string;
  subjectLine: string;
  campaignType?: string;
  status: "Active" | "Scheduled" | "Completed" | "Pending";
  deliveryStatus: string;
  category: string;
  campaignTopic: string;
  instructions: any[]; 
  reward: string;
  startDate: Date;
  endDate: Date;
  time: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<CampaignDoc>(
  {
    campaignName: { type: String, required: true },
    subjectLine: { type: String, required: true },
    campaignType: { type: String },
    status: {
      type: String,
      enum: ["Active", "Scheduled", "Completed", "Pending"],
      default: "Pending",
      required: true,
    },
    deliveryStatus: { type: String, required: true },
    category: { type: String, required: true },
    campaignTopic: { type: String, required: true },
    instructions: { type: [], default: [] }, 
    reward: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    time: { type: Date, required: true },
  },
  {
    timestamps: true
  }
);

export const CampaignModel = mongoose.model<CampaignDoc>("Campaign", CampaignSchema);
