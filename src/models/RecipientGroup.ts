import mongoose, { Schema } from 'mongoose';

export interface Contact {
  phone: string;
  createdAt?: Date;
}

export interface RecipientGroup extends Document {
  name: string;
  contacts: Contact[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema<Contact>({
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const RecipientGroupSchema: Schema = new Schema<RecipientGroup>(
  {
    name: { type: String, required: true },
    contacts: [ContactSchema],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const RecipientGroupModel = mongoose.model<RecipientGroup>('RecipientGroup', RecipientGroupSchema);
