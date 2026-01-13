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
exports.Publisher = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PublisherSchema = new mongoose_1.Schema({
    publisherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    avg_publish_time: { type: String, required: true },
    industry_focus: [{ type: String }],
    region_reach: [{ type: String }],
    audience_reach: { type: String, required: true },
    key_features: [{ type: String }],
    metrics: {
        domain_authority: { type: Number, required: false },
        trust_score: { type: Number, required: false },
        avg_traffic: { type: Number, required: false },
        social_signals: { type: Number, required: false }
    }
}, {
    timestamps: true
});
// Indexes for efficient queries
PublisherSchema.index({ industry_focus: 1 });
PublisherSchema.index({ region_reach: 1 });
PublisherSchema.index({ name: 'text' });
exports.Publisher = mongoose_1.default.model('Publisher', PublisherSchema);
