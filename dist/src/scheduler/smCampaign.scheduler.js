"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const SMCampaign_1 = require("../models/SMCampaign");
// Run every minute
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Checking for scheduled social media campaigns...");
    const now = new Date();
    // Find all social media campaigns due for publishing
    const smCampaigns = yield SMCampaign_1.SMCampaignModel.find({
        is_draft: false,
        is_published: false,
    });
    for (const smCampaign of smCampaigns) {
        try {
            // Publish it (e.g., to X, Meta, etc.)
            if (!smCampaign.schedule_date || !smCampaign.schedule_time)
                continue;
            // Combine date + time
            const scheduledDateTime = new Date(smCampaign.schedule_date);
            const [hours, minutes] = smCampaign.schedule_time.split(":").map(Number);
            scheduledDateTime.setHours(hours, minutes, 0, 0);
            // Compare and mark as published
            if (scheduledDateTime <= now) {
                smCampaign.is_published = true;
                yield smCampaign.save();
                console.log(`Published scheduled smCampaign: ${smCampaign._id}`);
            }
        }
        catch (err) {
            console.error(`Failed to publish post ${smCampaign.id}:`, err);
        }
    }
}));
