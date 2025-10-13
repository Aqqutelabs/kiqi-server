import mongoose, { Schema, Document } from 'mongoose';

export interface ISmsDraft {
  title?: string;
  message: string;
  recipientsGroupId?: mongoose.Types.ObjectId | null;
  recipients?: string[]; // array of phone numbers
  userId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SmsDraftDoc extends ISmsDraft, Document {}

const SmsDraftSchema: Schema = new Schema<ISmsDraft>(
  {
    title: { type: String, required: false },
    message: { type: String, required: true },
    recipientsGroupId: { type: Schema.Types.ObjectId, ref: 'RecipientGroup', required: false },
    recipients: { type: [String], required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SmsDraftModel = mongoose.model<SmsDraftDoc>('SmsDraft', SmsDraftSchema);
