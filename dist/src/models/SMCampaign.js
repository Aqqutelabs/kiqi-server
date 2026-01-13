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
exports.SMCampaignModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SMCampaignSchema = new mongoose_1.Schema({
    channel: { type: String },
    category: { type: String },
    name: { type: String, required: true },
    task_type: { type: String },
    instructions: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    url: { type: String },
    file: { type: String },
    budget: { type: Number, default: 0 },
    noOfParticipants: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    start_date: { type: Date },
    end_date: { type: Date },
    time: {
        type: String,
        //   match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
    action: {
        type: String,
        enum: ["publish", "schedule"],
        required: true
    },
    schedule_date: { type: Date },
    schedule_time: {
        type: String,
        //   match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
    is_published: { type: Boolean },
}, {
    timestamps: true
});
exports.SMCampaignModel = mongoose_1.default.model("SMCampaign", SMCampaignSchema);
