import mongoose, { Schema } from 'mongoose';

export interface SmsTemplate extends Document {
  title: string;
  message: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SmsTemplateSchema: Schema = new Schema<SmsTemplate>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SmsTemplateModel = mongoose.model<SmsTemplate>('SmsTemplate', SmsTemplateSchema);
