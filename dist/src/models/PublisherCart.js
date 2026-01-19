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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = exports.Bookmark = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Bookmark Schema
const BookmarkSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    publisherId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PublisherListing',
        required: true
    }
}, {
    timestamps: true
});
// Ensure unique bookmark per user-publisher combination
BookmarkSchema.index({ userId: 1, publisherId: 1 }, { unique: true });
// Cart Schema
const CartSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One cart per user
    },
    items: [{
            publisherId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'PublisherListing',
                required: true
            },
            publisherTitle: {
                type: String,
                required: true
            },
            basePrice: {
                type: Number,
                required: true,
                min: 0
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },
            selectedAddOns: [{
                    addonName: {
                        type: String,
                        required: true
                    },
                    addonPrice: {
                        type: Number,
                        required: true,
                        min: 0
                    },
                    quantity: {
                        type: Number,
                        min: 1
                    },
                    budget: {
                        type: Number,
                        min: 0
                    }
                }],
            subtotal: {
                type: Number,
                required: true,
                min: 0
            }
        }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
}, {
    timestamps: true
});
// Pre-save middleware to calculate total amount
CartSchema.pre('save', function (next) {
    this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
    next();
});
// Index for cart expiration cleanup
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Bookmark = mongoose_1.default.model('Bookmark', BookmarkSchema);
exports.Cart = mongoose_1.default.model('Cart', CartSchema);
