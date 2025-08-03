import { timeStamp } from "console";
import mongoose, { Schema, Document } from "mongoose";

export interface TemplateModel extends Document{
    _id: string;
    title: string;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const TemplateSchema: Schema = new Schema<TemplateModel> ({
    title: { type: String, required: true },
    content: { type: String, required: true},
}, 
{
    timestamps: true
}
)

export const TemplatesModel = mongoose.model<TemplateModel>("Templates", TemplateSchema)