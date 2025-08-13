import mongoose, { Schema } from "mongoose";

export interface ContactDoc extends Document {
    _id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    group: string;
}

const ContactSchema = new Schema<ContactDoc>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    emailAddress: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false },
    group: { type: String, required: true }
},
{
    timestamps: true
})

export const ContactModel = mongoose.model<ContactDoc>("Contact", ContactSchema);