import mongoose, { Schema } from "mongoose";

export interface EmailList extends Document{
    _id: string;
    email_listName: string;
    emails?: [];
    emailFiles?: [];
    createdAt: Date;   
    updatedAt: Date;
}

const EmailListSchema: Schema = new Schema<EmailList>({
    email_listName: { type: String, required: true },
    emails: { type: [], required: true },
    emailFiles: { type: [], required: true },
},
{
    timestamps: true
})

export const EmailListModel = mongoose.model<EmailList>("Email-List", EmailListSchema)