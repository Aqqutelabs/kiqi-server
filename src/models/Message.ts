import mongoose, { Schema, Document } from 'mongoose';

export type MessageFolder = 'inbox' | 'sent' | 'draft' | 'trash' | 'archive';

export interface MessageDoc extends Document {
    _id: string;
    user_id: mongoose.Types.ObjectId;
    threadId: mongoose.Types.ObjectId;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string; // HTML content
    plainText: string;
    folder: MessageFolder;
    isRead: boolean;
    isStarred: boolean;
    attachmentIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<MessageDoc>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        threadId: {
            type: Schema.Types.ObjectId,
            ref: 'Thread',
            required: true,
            index: true
        },
        from: {
            type: String,
            required: true,
            lowercase: true,
            validate: {
                validator: function (email: string) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                },
                message: 'Invalid email format'
            }
        },
        to: {
            type: [String],
            required: true,
            validate: {
                validator: function (arr: string[]) {
                    return arr.length > 0 && arr.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                },
                message: 'Invalid email addresses in to field'
            }
        },
        cc: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr: string[]) {
                    return arr.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                },
                message: 'Invalid email addresses in cc field'
            }
        },
        bcc: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr: string[]) {
                    return arr.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                },
                message: 'Invalid email addresses in bcc field'
            }
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        body: {
            type: String,
            required: true // HTML content
        },
        plainText: {
            type: String,
            required: true
        },
        folder: {
            type: String,
            enum: ['inbox', 'sent', 'draft', 'trash', 'archive'],
            default: 'inbox',
            index: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        isStarred: {
            type: Boolean,
            default: false,
            index: true
        },
        attachmentIds: {
            type: [Schema.Types.ObjectId],
            ref: 'Attachment',
            default: []
        }
    },
    { timestamps: true }
);

// Compound indexes for optimal query performance
MessageSchema.index({ user_id: 1, folder: 1, createdAt: -1 });
MessageSchema.index({ user_id: 1, isStarred: 1, createdAt: -1 });
MessageSchema.index({ user_id: 1, isRead: 1, createdAt: -1 });
MessageSchema.index({ user_id: 1, threadId: 1 });

export const MessageModel = mongoose.model<MessageDoc>('Message', MessageSchema);
