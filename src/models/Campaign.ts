import mongoose, { Schema, Document } from "mongoose";

// Campaign Types
export const CampaignTypes = ['Welcome', 'Promotional', 'Newsletter', 'AbandonedCart'] as const;
export type CampaignType = typeof CampaignTypes[number];

// Campaign Status
export const CampaignStatus = ['Draft', 'Scheduled', 'Active', 'Completed', 'Failed', 'Paused', 'Pending'] as const;
export type CampaignStatus = typeof CampaignStatus[number];

// Sender Config Interface
export interface SenderConfig {
    senderName: string;
    senderEmail: string;
    replyToEmail: string;
}

// Resend Settings Interface
export interface ResendSettings {
    enabled: boolean;
    waitTime: number; // in hours
    condition: 'Unopened' | 'Unclicked';
}

// Smart Settings Interface
export interface SmartSettings {
    fallbacks: {
        firstName: string;
        lastName: string;
        custom?: Record<string, string>;
    };
    sendLimits: {
        dailyLimit: number;
        batchSize: number;
        batchInterval: number; // in minutes
    };
    compliance: {
        includeUnsubscribe: boolean;
        includePermissionReminder: boolean;
        reminderText: string;
    };
    footer: {
        style: string;
        customText?: string;
    };
    optimization: {
        smartTimeEnabled: boolean;
        predictCTR: boolean;
    };
}

// Campaign Analytics Interface
export interface CampaignAnalytics {
    deliveries: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    bounces: number;
    complaints: number;
    lastUpdated: Date;
}

export interface AdvancedEmailSettings {
    excludeLists: {
        unsubscribed: boolean;
        bounced: boolean;
        inactive: boolean;
    };
    recipientEmailAddress: string;
    resendSettings: {
        resendToUnopened: boolean;
        dontResend: boolean;
        waitTimeDays: number | null;
    };
    fallbacks: {
        alternativeText: string;
        useIfPersonalizationFails: boolean;
        sendOncePerContact: boolean;
    };
    dailySendLimit: number;
    batchSending: {
        emailsPerBatch: number;
        intervalMinutes: number;
    };
    emailCompliance: {
        includeUnsubscribeLink: boolean;
        includePermissionReminder: boolean;
        permissionReminderText: string;
    };
}

export interface CampaignDoc extends Document {
    userId: any;
    priority: number;
    _id: string;
    user_id: mongoose.Types.ObjectId;
    campaignName: string;
    subjectLine: string;
    campaignType: CampaignType;
    status: CampaignStatus;
    deliveryStatus?: string;
    category?: string;
    campaignTopic?: string;
    instructions?: any[];
    reward?: string;
    
    // New fields
    sender: SenderConfig;
    audience: {
        emailLists: mongoose.Types.ObjectId[];
        excludeLists: mongoose.Types.ObjectId[];
        manualEmails?: string[];
    };
    content: {
        htmlContent: string;
        plainText: string;
    };
    resendSettings: ResendSettings;
    smartSettings: SmartSettings;
    schedule: {
        scheduledDate?: Date;
        startDate?: Date;
        endDate?: Date;
        time?: Date;
        useRecipientTimezone: boolean;
    };
    analytics: CampaignAnalytics;
    metadata: {
        aiGenerated?: boolean;
        templateId?: string;
        tags?: string[];
    };
    advancedSettings?: AdvancedEmailSettings;
    
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema = new Schema<CampaignDoc>({
    user_id: {
        type: Schema.Types.ObjectId,
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
        enum: CampaignTypes,
        default: 'Newsletter'
    },
    status: {
        type: String,
        enum: CampaignStatus,
        default: 'Draft'
    },
    // Preserve existing fields
    deliveryStatus: { type: String, default: "Pending" },
    category: { type: String, default: "General" },
    campaignTopic: { type: String },
    instructions: { type: [Schema.Types.Mixed], default: [] },
    reward: { type: String },

    // New fields
    sender: {
        senderName: {
            type: String,
            trim: true
        },
        senderEmail: {
            type: String,
            trim: true,
            lowercase: true
        },
        replyToEmail: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    audience: {
        emailLists: [{
            type: Schema.Types.ObjectId,
            ref: 'Email-List'
        }],
        excludeLists: [{
            type: Schema.Types.ObjectId,
            ref: 'Email-List'
        }],
        manualEmails: [{
            type: String,
            validate: {
                validator: function(email: string) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                },
                message: 'Invalid email format'
            }
        }]
    },
    content: {
        htmlContent: {
            type: String,
            default: ''
        },
        plainText: {
            type: String,
            default: ''
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
    },
    advancedSettings: {
        excludeLists: {
            unsubscribed: {
                type: Boolean,
                default: true
            },
            bounced: {
                type: Boolean,
                default: true
            },
            inactive: {
                type: Boolean,
                default: false
            }
        },
        recipientEmailAddress: {
            type: String,
            default: ""
        },
        resendSettings: {
            resendToUnopened: {
                type: Boolean,
                default: false
            },
            dontResend: {
                type: Boolean,
                default: true
            },
            waitTimeDays: {
                type: Number,
                default: null
            }
        },
        fallbacks: {
            alternativeText: {
                type: String,
                default: ""
            },
            useIfPersonalizationFails: {
                type: Boolean,
                default: false
            },
            sendOncePerContact: {
                type: Boolean,
                default: true
            }
        },
        dailySendLimit: {
            type: Number,
            default: 5000
        },
        batchSending: {
            emailsPerBatch: {
                type: Number,
                default: 500
            },
            intervalMinutes: {
                type: Number,
                default: 10
            }
        },
        emailCompliance: {
            includeUnsubscribeLink: {
                type: Boolean,
                default: true
            },
            includePermissionReminder: {
                type: Boolean,
                default: true
            },
            permissionReminderText: {
                type: String,
                default: "You are receiving this email because you signed up for our newsletter."
            }
        }
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
CampaignSchema.pre('save', function(next) {
    // Update analytics lastUpdated
    if (this.isModified('analytics')) {
        this.analytics.lastUpdated = new Date();
    }
    next();
});

// Method to get total audience count
CampaignSchema.methods.getTotalAudienceCount = async function(): Promise<number> {
    let total = 0;
    
    // Count from email lists
    if (this.audience.emailLists?.length) {
        const EmailList = mongoose.model('Email-List');
        const lists = await EmailList.find({
            _id: { $in: this.audience.emailLists }
        });
        total += lists.reduce((sum, list) => sum + (list.contacts?.length || 0), 0);
    }
    
    // Add manual emails
    if (this.audience.manualEmails?.length) {
        total += this.audience.manualEmails.length;
    }
    
    // Subtract excluded lists
    if (this.audience.excludeLists?.length) {
        const EmailList = mongoose.model('Email-List');
        const excludedLists = await EmailList.find({
            _id: { $in: this.audience.excludeLists }
        });
        total -= excludedLists.reduce((sum, list) => sum + (list.contacts?.length || 0), 0);
    }
    
    return Math.max(0, total);
};

export const CampaignModel = mongoose.model<CampaignDoc>("Campaign", CampaignSchema);
