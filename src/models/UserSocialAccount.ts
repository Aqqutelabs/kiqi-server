import mongoose, { Document, Schema } from "mongoose";

export interface IUserSocialAccount extends Document {
    user_id: mongoose.Types.ObjectId;
    platform: "instagram" | "facebook" | "whatsapp";
    account_id?: string;
    username?: string;
    access_token: string;
    refresh_token?: string;
    token_expires_at?: Date;
    meta?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const UserSocialAccountSchema = new Schema<IUserSocialAccount>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        platform: {
            type: String,
            enum: ["instagram", "facebook", "x", "linkedin"],
            required: true,
        },
        account_id: { type: String },
        username: { type: String },
        access_token: { type: String, required: true },
        refresh_token: { type: String },
        token_expires_at: { type: Date },
        meta: { type: Object },
    },
    { timestamps: true }
);

UserSocialAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

export default mongoose.model<IUserSocialAccount>("UserSocialAccount", UserSocialAccountSchema);