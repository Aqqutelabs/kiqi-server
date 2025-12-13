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
exports.PressRelease = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PressReleaseSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled'],
        required: true
    },
    distribution: { type: String },
    performance_views: { type: String },
    title: { type: String },
    campaign: { type: String },
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    date_created: { type: String, required: true },
    metrics: {
        total_views: { type: Number, default: 0 },
        total_clicks: { type: Number, default: 0 },
        engagement_rate: { type: String, default: '0%' },
        avg_time_on_page: { type: String, default: '0:00' }
    },
    distribution_report: [{
            outlet_name: { type: String, required: true },
            outlet_status: {
                type: String,
                enum: ['Published', 'Pending'],
                required: true
            },
            outlet_clicks: { type: Number, default: 0 },
            outlet_views: { type: String, default: '0' },
            publication_link: { type: String },
            publication_date: { type: String }
        }],
    content: { type: String, required: true },
    image: { type: String } // Added optional image field
}, {
    timestamps: true
});
// Indexes for efficient queries
PressReleaseSchema.index({ status: 1 });
PressReleaseSchema.index({ title: 'text' });
PressReleaseSchema.index({ user_id: 1 });
exports.PressRelease = mongoose_1.default.model('PressRelease', PressReleaseSchema);
