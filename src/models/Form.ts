import { Schema, model, Document, Types } from "mongoose";

export enum FieldType {
  TEXT = "text",
  EMAIL = "email",
  PHONE = "phone",
  DROPDOWN = "dropdown",
  CHECKBOX = "checkbox",
  MULTI_SELECT = "multi-select",
  PARAGRAPH = "paragraph",
}

interface IFormField {
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Used for dropdowns/multi-select
}

export interface IForm extends Document {
  userId: Types.ObjectId; // Owner
  name: string;
  fields: IFormField[];
  isActive: boolean;
  submissionCount: number;
  createdAt: Date;
}

const FormSchema = new Schema<IForm>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    fields: [
      {
        type: { type: String, enum: Object.values(FieldType), required: true },
        label: { type: String, required: true },
        placeholder: { type: String },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
      },
    ],
    isActive: { type: Boolean, default: true },
    submissionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FormModel = model<IForm>("Form", FormSchema);