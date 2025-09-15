import mongoose, { Schema } from "mongoose";

export interface EmailWithName {
    email: string;
    fullName?: string;
}

export interface EmailList extends Document{
    _id: string;
    email_listName: string;
    emails?: EmailWithName[];
    emailFiles?: string[];
    createdAt: Date;   
    updatedAt: Date;
    userId: mongoose.Types.ObjectId; // Change userId type to mongoose.Types.ObjectId
}

const EmailListSchema: Schema = new Schema<EmailList>({
    email_listName: { type: String, required: true },
    emails: [{
        email: { type: String, required: true },
        fullName: { type: String, required: false }
    }],
    emailFiles: { type: [String], required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Add userId field to EmailList schema
},
{
    timestamps: true
})

export const EmailListModel = mongoose.model<EmailList>("Email-List", EmailListSchema)