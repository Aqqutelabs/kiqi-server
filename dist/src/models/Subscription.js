"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SubscriptionSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planName: {
        type: String,
        enum: ['Basic', 'Pro', 'Enterprise'],
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
        enum: ['Active', 'Canceled', 'Expired'],
        default: 'Active',
        index: true
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
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
            validator: function (value) {
                return value <= this.endDate;
            },
            message: 'Next billing date must be before or equal to end date'
        }
    },
    paymentMethodId: {
        type: String,
        required: false
    },
    monthlyCredits: {
        type: Number,
        required: true,
        min: 0
    },
    coinMultiplier: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        required: false,
        default: 'monthly'
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    metadata: {
        lastBillingDate: Date,
        cancellationDate: Date,
        reason: String
    },
}, {
    timestamps: true
});
// Add compound indices for common queries
SubscriptionSchema.index({ user_id: 1, status: 1 });
SubscriptionSchema.index({ user_id: 1, endDate: 1 });
// Add static method to find active subscription
SubscriptionSchema.statics.findActiveSubscription = function (userId) {
    const userObjectId = typeof userId === 'string' ? new mongoose_1.default.Types.ObjectId(userId) : userId;
    return this.findOne({
        user_id: userObjectId,
        status: 'Active',
        endDate: { $gt: new Date() }
    });
};
// Ensure only one active subscription per user
SubscriptionSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.status === 'Active' && this.isModified('status')) {
            yield this.model('Subscription').updateMany({
                user_id: this.user_id,
                _id: { $ne: this._id },
                status: 'Active'
            }, { status: 'Canceled' });
        }
        next();
    });
});
// Auto-update status when end date is reached
SubscriptionSchema.pre('save', function (next) {
    const now = new Date();
    if (now > this.endDate && this.status === 'Active') {
        this.status = 'Expired';
    }
    next();
});
// Create the model
exports.Subscription = mongoose_1.default.model('Subscription', SubscriptionSchema);
