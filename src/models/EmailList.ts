import mongoose, { Schema } from "mongoose";

export interface EmailList extends Document{
    _id: string;
    email_listName: string;
    emails?: string[];
    emailFiles?: string[];
    createdAt: Date;   
    updatedAt: Date;
    userId: mongoose.Types.ObjectId; // Change userId type to mongoose.Types.ObjectId
}

const EmailListSchema: Schema = new Schema<EmailList>({
    email_listName: { type: String, required: true },
    emails: { type: [String], required: true },
    emailFiles: { type: [String], required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Add userId field to EmailList schema
},
{
    timestamps: true
})

export const EmailListModel = mongoose.model<EmailList>("Email-List", EmailListSchema)