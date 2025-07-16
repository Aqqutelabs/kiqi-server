import mongoose, { Schema } from "mongoose";


export interface ReGenerateEmail extends Document{
    _id: string;
    emailId: string;
    prompt: string;
}

const ReGenerateEmailSchema: Schema = new Schema<ReGenerateEmail>({
    emailId: { type: String, required: true },
    prompt: { type: String, required: true }
})

export const ReGenerateModel = mongoose.model<ReGenerateEmail>("re-generate-email", ReGenerateEmailSchema)
