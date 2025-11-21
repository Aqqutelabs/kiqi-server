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
exports.CampaignModel = exports.CampaignStatus = exports.CampaignTypes = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Campaign Types
exports.CampaignTypes = ['Welcome', 'Promotional', 'Newsletter', 'AbandonedCart'];
// Campaign Status
exports.CampaignStatus = ['Draft', 'Scheduled', 'Active', 'Completed', 'Failed', 'Paused', 'Pending'];
const CampaignSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    campaignName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    subjectLine: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    campaignType: {
        type: String,
        enum: exports.CampaignTypes,
        required: true
    },
    status: {
        type: String,
        enum: exports.CampaignStatus,
        default: 'Draft'
    },
    // Preserve existing fields
    deliveryStatus: { type: String, default: "Pending" },
    category: { type: String, default: "General" },
    campaignTopic: { type: String },
    instructions: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    reward: { type: String },
    // New fields
    sender: {
        senderName: {
            type: String,
            required: true,
            trim: true
        },
        senderEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        replyToEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        }
    },
    audience: {
        emailLists: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Email-List'
            }],
        excludeLists: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Email-List'
            }],
        manualEmails: [{
                type: String,
                validate: {
                    validator: function (email) {
                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                    },
                    message: 'Invalid email format'
                }
            }]
    },
    content: {
        htmlContent: {
            type: String,
            required: true
        },
        plainText: {
            type: String,
            required: true
        }
    },
    resendSettings: {
        enabled: {
            type: Boolean,
            default: false
        },
        waitTime: {
            type: Number,
            default: 48 // 2 days in hours
        },
        condition: {
            type: String,
            enum: ['Unopened', 'Unclicked'],
            default: 'Unopened'
        }
    },
    smartSettings: {
        fallbacks: {
            firstName: {
                type: String,
                default: 'there'
            },
            lastName: {
                type: String,
                default: ''
            },
            custom: {
                type: Map,
                of: String
            }
        },
        sendLimits: {
            dailyLimit: {
                type: Number,
                default: 5000
            },
            batchSize: {
                type: Number,
                default: 500
            },
            batchInterval: {
                type: Number,
                default: 10
            }
        },
        compliance: {
            includeUnsubscribe: {
                type: Boolean,
                default: true
            },
            includePermissionReminder: {
                type: Boolean,
                default: true
            },
            reminderText: {
                type: String,
                default: "You're receiving this email because you subscribed to our mailing list"
            }
        },
        footer: {
            style: {
                type: String,
                default: 'default'
            },
            customText: String
        },
        optimization: {
            smartTimeEnabled: {
                type: Boolean,
                default: false
            },
            predictCTR: {
                type: Boolean,
                default: false
            }
        }
    },
    schedule: {
        scheduledDate: Date,
        startDate: Date,
        endDate: Date,
        time: Date,
        useRecipientTimezone: {
            type: Boolean,
            default: false
        }
    },
    analytics: {
        deliveries: {
            type: Number,
            default: 0
        },
        opens: {
            type: Number,
            default: 0
        },
        clicks: {
            type: Number,
            default: 0
        },
        unsubscribes: {
            type: Number,
            default: 0
        },
        bounces: {
            type: Number,
            default: 0
        },
        complaints: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    metadata: {
        aiGenerated: Boolean,
        templateId: String,
        tags: [String]
    }
}, {
    timestamps: true
});
// Indexes for performance
CampaignSchema.index({ user_id: 1, status: 1 });
CampaignSchema.index({ 'schedule.scheduledDate': 1 }, { sparse: true });
CampaignSchema.index({ 'analytics.lastUpdated': 1 });
CampaignSchema.index({ campaignName: 'text', subjectLine: 'text' });
// Pre-save middleware
CampaignSchema.pre('save', function (next) {
    // Update analytics lastUpdated
    if (this.isModified('analytics')) {
        this.analytics.lastUpdated = new Date();
    }
    next();
});
// Method to get total audience count
CampaignSchema.methods.getTotalAudienceCount = function () {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        let total = 0;
        // Count from email lists
        if ((_a = this.audience.emailLists) === null || _a === void 0 ? void 0 : _a.length) {
            const EmailList = mongoose_1.default.model('Email-List');
            const lists = yield EmailList.find({
                _id: { $in: this.audience.emailLists }
            });
            total += lists.reduce((sum, list) => { var _a; return sum + (((_a = list.contacts) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        }
        // Add manual emails
        if ((_b = this.audience.manualEmails) === null || _b === void 0 ? void 0 : _b.length) {
            total += this.audience.manualEmails.length;
        }
        // Subtract excluded lists
        if ((_c = this.audience.excludeLists) === null || _c === void 0 ? void 0 : _c.length) {
            const EmailList = mongoose_1.default.model('Email-List');
            const excludedLists = yield EmailList.find({
                _id: { $in: this.audience.excludeLists }
            });
            total -= excludedLists.reduce((sum, list) => { var _a; return sum + (((_a = list.contacts) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        }
        return Math.max(0, total);
    });
};
exports.CampaignModel = mongoose_1.default.model("Campaign", CampaignSchema);
