import mongoose, { Schema, Document } from 'mongoose';

export interface ThreadDoc extends Document {
    _id: string;
    user_id: mongoose.Types.ObjectId;
    subject: string;
    participants: string[]; // email addresses
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ThreadSchema = new Schema<ThreadDoc>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        participants: {
            type: [String],
            required: true,
            validate: {
                validator: function (arr: string[]) {
                    return arr.length > 0 && arr.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
                },
                message: 'Participants must be valid email addresses'
            }
        },
        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Compound index for faster queries
ThreadSchema.index({ user_id: 1, createdAt: -1 });
ThreadSchema.index({ user_id: 1, lastMessageAt: -1 });

export const ThreadModel = mongoose.model<ThreadDoc>('Thread', ThreadSchema);
