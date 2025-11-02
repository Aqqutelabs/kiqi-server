import mongoose, { Schema, Document, Model } from 'mongoose';
import { Subscription as ISubscription } from '../types/account.types';

// Define base subscription properties with Mongoose types
interface SubscriptionBase {
    user_id: mongoose.Types.ObjectId;
    planName: ISubscription['planName'];
    price: number;
    features: string[];
    status: ISubscription['status'];
    startDate: Date;
    endDate: Date;
    nextBillingDate: Date;
    paymentMethodId: string;
}

// Define the document interface
interface SubscriptionDocument extends Document, SubscriptionBase {
    createdAt: Date;
    updatedAt: Date;
}

// Define static methods interface
interface SubscriptionModel extends Model<SubscriptionDocument> {
    findActiveSubscription(userId: string | mongoose.Types.ObjectId): Promise<SubscriptionDocument | null>;
}

const SubscriptionSchema = new Schema<SubscriptionDocument>({
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    planName: { 
        type: String, 
        enum: ['Basic', 'Pro', 'Enterprise'] as const,
        required: true 
    },
    price: { 
        type: Number, 
        required: true,
        min: 0 
    },
    features: [{ 
        type: String,
        required: true 
    }],
    status: { 
        type: String, 
        enum: ['Active', 'Canceled', 'Expired'] as const,
        default: 'Active',
        index: true
    },
    startDate: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(this: SubscriptionDocument, value: Date) {
                return value <= this.endDate;
            },
            message: 'Start date must be before or equal to end date'
        }
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    nextBillingDate: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(this: SubscriptionDocument, value: Date) {
                return value <= this.endDate;
            },
            message: 'Next billing date must be before or equal to end date'
        }
    },
    paymentMethodId: { 
        type: String, 
        required: true 
    }
}, {
    timestamps: true
});

// Add compound indices for common queries
SubscriptionSchema.index({ user_id: 1, status: 1 });
SubscriptionSchema.index({ user_id: 1, endDate: 1 });

// Add static method to find active subscription
SubscriptionSchema.statics.findActiveSubscription = function(userId: string | mongoose.Types.ObjectId) {
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.findOne({ 
        user_id: userObjectId,
        status: 'Active',
        endDate: { $gt: new Date() }
    });
};

// Ensure only one active subscription per user
SubscriptionSchema.pre<SubscriptionDocument>('save', async function(next) {
    if (this.status === 'Active' && this.isModified('status')) {
        await this.model<SubscriptionModel>('Subscription').updateMany(
            { 
                user_id: this.user_id, 
                _id: { $ne: this._id },
                status: 'Active'
            },
            { status: 'Canceled' }
        );
    }
    next();
});

// Auto-update status when end date is reached
SubscriptionSchema.pre<SubscriptionDocument>('save', function(next) {
    const now = new Date();
    if (now > this.endDate && this.status === 'Active') {
        this.status = 'Expired';
    }
    next();
});

// Create the model
export const Subscription = mongoose.model<SubscriptionDocument, SubscriptionModel>(
    'Subscription', 
    SubscriptionSchema
);