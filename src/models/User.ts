import mongoose, { Document, Schema } from "mongoose";

export type UserRole = 'user' | 'admin';

export interface User extends Document{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string; // Optional because of social logins
    role: UserRole;
    organizationName: string;
    googleId?: string;
    walletAddress?: string;
    refreshToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    senderEmail?: string; // New field for sender email
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema<User>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    senderEmail: { type: String, required: false }, // New field for sender email

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
},
{timestamps: true})

export const UserModel = mongoose.model<User>("User", UserSchema)

export interface Organization {
    id: string;
    name: string;
    ownerId: string;
}

export interface ChatbotSettings {
    id: string;
    organizationId: string;
    name: string;
    avatarUrl: string;
    theme: string;
    welcomeMessage: string;
    widgetPosition: 'Left Top' | 'Left Bottom' | 'Right Top' | 'Right Bottom';
    tone: 'Informal' | 'Formal';
}

export interface WordpressConnection {
    id: string;
    organizationId: string;
    publicUrl: string;
    username: string;
    // Password should be encrypted at rest
    encryptedPassword?: string;
}