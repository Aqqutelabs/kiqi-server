import mongoose, { Schema, Document } from 'mongoose';

export interface AttachmentDoc extends Document {
    _id: string;
    messageId: mongoose.Types.ObjectId;
    fileName: string;
    mimeType: string;
    size: number; // in bytes
    url: string; // S3 or Cloudinary URL
    createdAt: Date;
}

const AttachmentSchema = new Schema<AttachmentDoc>(
    {
        messageId: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
            required: true,
            index: true
        },
        fileName: {
            type: String,
            required: true,
            trim: true
        },
        mimeType: {
            type: String,
            required: true // e.g., application/pdf, image/png
        },
        size: {
            type: Number,
            required: true // in bytes
        },
        url: {
            type: String,
            required: true // S3 or Cloudinary URL
        }
    },
    { timestamps: true }
);

export const AttachmentModel = mongoose.model<AttachmentDoc>('Attachment', AttachmentSchema);
