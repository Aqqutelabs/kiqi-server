import { timeStamp } from "console";
import mongoose, { Schema, Document } from "mongoose";

export interface SMCampaignModel extends Document {
  _id: string;
  channel: string;
  category: string;
  name: string;
  task_type: string;
  instructions?: Record<string, any>;
  url: string;
  file?: string;
  budget: number;
  noOfParticipants: number;
  reward: number;
  start_date: Date;
  end_date: Date;
  time: string;
  action: string;
  schedule_date: Date;
  schedule_time: string;
  is_published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const SMCampaignSchema: Schema = new Schema<SMCampaignModel>({
  channel: { type: String },
  category: { type: String },
  name: { type: String, required: true },
  task_type: { type: String },
  instructions: {
    type: Schema.Types.Mixed,
    default: {}
  },
  url: { type: String },
  file: { type: String },
  budget: { type: Number, default: 0 },
  noOfParticipants: { type: Number, default: 0 },
  reward: { type: Number, default: 0 },
  start_date: { type: Date },
  end_date: { type: Date },
  time: {
    type: String,
    //   match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
  },
  action: {
    type: String,
    enum: ["publish", "schedule"],
    required: true
  },
  schedule_date: { type: Date },
  schedule_time: {
    type: String,
    //   match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
  },
  is_published: { type: Boolean },
},
  {
    timestamps: true
  }
)

export const SMCampaignModel = mongoose.model<SMCampaignModel>("SMCampaign", SMCampaignSchema)