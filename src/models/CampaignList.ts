import { Schema, model, Document, Types } from "mongoose";

export interface IList extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  contacts: Types.ObjectId[]; // Array of Contact IDs
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema = new Schema<IList>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    contacts: [{ type: Schema.Types.ObjectId, ref: "CampaignContact" }],
  },
  { timestamps: true }
);

export const ListModel = model<IList>("List", ListSchema);