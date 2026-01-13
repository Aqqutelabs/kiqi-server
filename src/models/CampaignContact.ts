import { Schema, model, Document, Types } from "mongoose";

interface ICampaignEmail {
  address: string;
  isPrimary: boolean;
}

interface ICampaignPhone {
  number: string;
  isPrimary: boolean;
}

export interface ICampaignContact extends Document {
  userId: Types.ObjectId; // Owner of the contact
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  emails: ICampaignEmail[];
  phones: ICampaignPhone[];
  tags: string[];
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignContactSchema = new Schema<ICampaignContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    jobTitle: { type: String, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    emails: [
      {
        address: { type: String, lowercase: true, trim: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    phones: [
      {
        number: { type: String, trim: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    tags: [{ type: String, trim: true }],
    notes: { type: String },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for search functionality (Search by name, email, or company)
CampaignContactSchema.index({ firstName: "text", lastName: "text", company: "text", "emails.address": "text" });

export const CampaignContactModel = model<ICampaignContact>("CampaignContact", CampaignContactSchema);