import mongoose, { Schema } from "mongoose";

export interface EmailList extends Document{
    _id: string;
    email_listName: string;
    totalEmails: number;
    emails?: [];
    emailFiles?: [];
    createdAt: Date;   
    updatedAt: Date;
}

const EmailListSchema: Schema = new Schema<EmailList>({
    email_listName: { type: String, required: true },
    totalEmails: { type: Number, required: true },
    emails: { type: [], required: true },
    emailFiles: { type: [], required: true },
    createdAt: { type: Date, required: true }
})

export const EmailListModel = mongoose.model<EmailList>("Email-List", EmailListSchema)