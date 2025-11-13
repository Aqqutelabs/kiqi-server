import mongoose, { Document, Schema } from "mongoose"

export interface SenderEmailModel extends Document{ 
    _id: string;
    senderName: String;
    type: String;
    senderEmail: String;
    user_id?: mongoose.Types.ObjectId;
    verified?: boolean;
    verificationCode?: string;
    verificationExpires?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const SenderEmailSchema: Schema = new Schema<SenderEmailModel>({
    senderName: { type: String, required: true },
    type: { type: String, required: true }, 
    senderEmail: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, required: false },
    verificationExpires: { type: Date, required: false }
}, 
{
    timestamps: true
})

export const SenderModel = mongoose.model<SenderEmailModel>("SenderEmail", SenderEmailSchema)