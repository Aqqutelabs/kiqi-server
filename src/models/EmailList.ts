import mongoose, { Schema } from "mongoose";

export interface EmailList extends Document{
    _id: string;
    email_listName: string;
    emails?: string[];
    emailFiles?: string[];
    createdAt: Date;   
    updatedAt: Date;
}

const EmailListSchema: Schema = new Schema<EmailList>({
    email_listName: { type: String, required: true },
    emails: { type: [String], required: true },
    emailFiles: { type: [String], required: true },
},
{
    timestamps: true
})

export const EmailListModel = mongoose.model<EmailList>("Email-List", EmailListSchema)