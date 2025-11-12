import mongoose, { Document, Schema } from 'mongoose';

export interface IAIEmail extends Document {
  recipient: string;
  context: string;
  tone: string;
  content: string;
  userId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIEmailSchema = new Schema<IAIEmail>(
  {
    recipient: {
      type: String,
      required: [false, 'Recipient is required'],
    },
    context: {
      type: String,
      required: [true, 'Context is required'],
    },
    tone: {
      type: String,
      required: [true, 'Tone is required'],
      enum: ['Professional', 'Casual', 'Friendly', 'Formal'],
    },
    content: {
      type: String,
      required: [true, 'Generated content is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAIEmail>('AIEmail', AIEmailSchema);