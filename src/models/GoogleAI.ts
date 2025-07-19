import mongoose, { Schema } from "mongoose";

export interface GenerateEmail extends Document{
    _id: string;
    prompt: String;
    result: string;
    createdAt: String;
}

const GenerateEmailSchema: Schema = new Schema<GenerateEmail>({
    prompt: { type: String, required: true },
    result: { type: String, required: true },
    createdAt: { type: String, required: true }
})

export const GenerateEmailModel = mongoose.model<GenerateEmail>("aiPrompt-generate-email", GenerateEmailSchema)


