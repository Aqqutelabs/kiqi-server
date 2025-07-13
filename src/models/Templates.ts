import mongoose, { Schema } from "mongoose";

export interface TemplateModel extends Document{
    _id: string;
    title: string;
    content: string;
}

const TemplateSchema: Schema = new Schema<TemplateModel> ({
    title: { type: String, required: true },
    content: { type: String, required: true}
})

export const TemplatesModel = mongoose.model<TemplateModel>("Templates", TemplateSchema)