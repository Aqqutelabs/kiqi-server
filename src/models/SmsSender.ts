import mongoose, { Schema } from 'mongoose';

export interface SmsSender extends Document {
  name: string;
  sampleMessage?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SmsSenderSchema: Schema = new Schema<SmsSender>(
  {
    name: { type: String, required: true },
    sampleMessage: { type: String, required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SmsSenderModel = mongoose.model<SmsSender>('SmsSender', SmsSenderSchema);
