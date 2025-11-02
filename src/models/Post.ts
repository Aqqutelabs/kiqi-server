import mongoose, { Schema, Document } from 'mongoose';

export interface PostDoc extends Document {
    _id: string;
    platform?: string;
    message?: string;
    media?: string;
    is_draft: boolean;
    publish_date?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema: Schema = new Schema(
    {
        platform: { type: String },
        message: { type: String },
        media: { type: String },
        is_draft: { type: Boolean, default: true },
        publish_date: { type: Date, default: null },
    },
    { timestamps: true }
);

export const PostModel = mongoose.model<PostDoc>("Campaign", PostSchema);