import { Schema, model, Document, Types } from "mongoose";

export interface IFormSubmission extends Document {
  formId: Types.ObjectId;
  userId: Types.ObjectId; // The owner of the form
  contactId: Types.ObjectId; // The CRM contact created/updated by this submission
  data: Record<string, any>; // Stores dynamic field values (e.g., { "First Name": "Sarah" })
  createdAt: Date;
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const FormSubmissionModel = model<IFormSubmission>("FormSubmission", FormSubmissionSchema);