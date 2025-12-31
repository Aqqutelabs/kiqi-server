"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignContactModel = void 0;
const mongoose_1 = require("mongoose");
const CampaignContactSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    jobTitle: { type: String, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    emails: [
        {
            address: { type: String, lowercase: true, trim: true },
            isPrimary: { type: Boolean, default: false },
        },
    ],
    phones: [
        {
            number: { type: String, trim: true },
            isPrimary: { type: Boolean, default: false },
        },
    ],
    tags: [{ type: String, trim: true }],
    notes: { type: String },
    isArchived: { type: Boolean, default: false },
}, { timestamps: true });
// Index for search functionality (Search by name, email, or company)
CampaignContactSchema.index({ firstName: "text", lastName: "text", company: "text", "emails.address": "text" });
exports.CampaignContactModel = (0, mongoose_1.model)("CampaignContact", CampaignContactSchema);
