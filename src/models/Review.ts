import mongoose, { Schema, Document } from 'mongoose';

interface ReviewDocument extends Document {
    press_release_id: Schema.Types.ObjectId;
    user_id?: Schema.Types.ObjectId; // Optional, for logged-in users
    reviewer_name?: string; // Optional display name
    rating: number; // 1-5 stars
    review_text: string;
    status: 'pending' | 'verified' | 'rejected'; // For moderation
    created_at: Date;
    updated_at: Date;
}

const ReviewSchema = new Schema<ReviewDocument>({
    press_release_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'PressRelease', 
        required: true 
    },
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    reviewer_name: { 
        type: String, 
        trim: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    review_text: { 
        type: String, 
        required: true, 
        trim: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
ReviewSchema.index({ press_release_id: 1 });
ReviewSchema.index({ user_id: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ rating: 1 });

export const Review = mongoose.model<ReviewDocument>('Review', ReviewSchema);