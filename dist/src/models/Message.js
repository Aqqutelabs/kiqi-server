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
exports.MessageModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    threadId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
        index: true
    },
    from: {
        type: String,
        required: true,
        lowercase: true,
        validate: {
            validator: function (email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Invalid email format'
        }
    },
    to: {
        type: [String],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length > 0 && arr.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            },
            message: 'Invalid email addresses in to field'
        }
    },
    cc: {
        type: [String],
        default: [],
        validate: {
            validator: function (arr) {
                return arr.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
            },
            message: 'Invalid email addresses in cc field'
        }
    },
    bcc: {
        type: [String],
        default: [],
        validate: {
            validator: function (arr) {
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
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Attachment',
        default: []
    }
}, { timestamps: true });
// Compound indexes for optimal query performance
MessageSchema.index({ user_id: 1, folder: 1, createdAt: -1 });
MessageSchema.index({ user_id: 1, isStarred: 1, createdAt: -1 });
MessageSchema.index({ user_id: 1, isRead: 1, createdAt: -1 });
MessageSchema.index({ user_id: 1, threadId: 1 });
exports.MessageModel = mongoose_1.default.model('Message', MessageSchema);
