import mongoose, { Schema, Document } from "mongoose";

export interface CampaignDoc extends Document {
  _id: string;
  campaignName: string;
  subjectLine: string;
  campaignType?: string;
  status?: "Active" | "Scheduled" | "Completed" | "Pending";
  deliveryStatus?: string;
  category?: string;
  campaignTopic?: string;
  instructions?: any[]; 
  reward?: string;
  startDate?: Date;
  endDate?: Date;
  time?: Date;
  senderEmail?: string;
  emailListIds?: string[];
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
    deliveryStatus: { type: String, required: true, default: " " },
    category: { type: String, required: true, default: " " },
    campaignTopic: { type: String, required: true, default: " " },
    instructions: { type: [], required: true, default: [] }, 
    reward: { type: String, required: true, default: " " },
    startDate: { type: Date, required: false, default: null },
    endDate: { type: Date, required: false, default: null },
    time: { type: Date, required: false, default: null },
    senderEmail: { type: String, required: false },
    emailListIds: [{ type: Schema.Types.ObjectId, ref: 'Email-List', required: false }],
  },
  {
    timestamps: true
  }
);

export const CampaignModel = mongoose.model<CampaignDoc>("Campaign", CampaignSchema);
