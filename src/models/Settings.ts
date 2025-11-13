import mongoose, { Schema, Document } from 'mongoose';

export interface EmailCompliance {
	includeSubscribedLink: boolean;
	includePermissionReminder: boolean;
}

export interface UserSettingsBase {
	user_id: mongoose.Types.ObjectId;
	altText: string; // Alternative text
	dailySendLimit: number;
	batchSendingTime: string; // store as HH:MM or ISO time string
	emailCompliance: EmailCompliance;
}

export interface UserSettingsDocument extends Document, UserSettingsBase {
	createdAt: Date;
	updatedAt: Date;
}

const EmailComplianceSchema = new Schema<EmailCompliance>({
	includeSubscribedLink: { type: Boolean, default: true },
	includePermissionReminder: { type: Boolean, default: true }
}, { _id: false });

const SettingsSchema = new Schema<UserSettingsDocument>({
	user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
	altText: { type: String, default: '' },
	dailySendLimit: { type: Number, default: 1000 },
	batchSendingTime: { type: String, default: '09:00' },
	emailCompliance: { type: EmailComplianceSchema, default: () => ({}) }
}, { timestamps: true });

export const SettingsModel = mongoose.model<UserSettingsDocument>('Settings', SettingsSchema);

export default SettingsModel;

export interface Settings {}