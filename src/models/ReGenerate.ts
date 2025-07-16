import mongoose, { Schema } from "mongoose";


export interface ReGenerateEmail extends Document{
    _id: string;
    emailId: String;
    prompt: String;
    regenerated: String;
    regeneratedAt: String;
}

const ReGenerateEmailSchema: Schema = new Schema<ReGenerateEmail>({
    emailId: { type: String, required: true },
    prompt: { type: String, required: true },
    regenerated: { type: String, required: true },
    regeneratedAt: { type: String, required: true }
})

export const ReGenerateModel = mongoose.model<ReGenerateEmail>("re-generate-email", ReGenerateEmailSchema)
