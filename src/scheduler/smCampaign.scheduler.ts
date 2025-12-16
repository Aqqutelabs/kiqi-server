import cron from "node-cron";
import { SMCampaignModel } from "../models/SMCampaign";

// Run every minute
cron.schedule("* * * * *", async () => {
    console.log("Checking for scheduled social media campaigns...");

    const now = new Date();

    // Find all social media campaigns due for publishing
    const smCampaigns = await SMCampaignModel.find({
        is_draft: false,
        is_published: false,
    });

    for (const smCampaign of smCampaigns) {
        try {
            // Publish it (e.g., to X, Meta, etc.)

            if (!smCampaign.schedule_date || !smCampaign.schedule_time) continue;

            // Combine date + time
            const scheduledDateTime = new Date(smCampaign.schedule_date);
            const [hours, minutes] = smCampaign.schedule_time.split(":").map(Number);
            scheduledDateTime.setHours(hours, minutes, 0, 0);
            // Compare and mark as published
            if (scheduledDateTime <= now) {
                smCampaign.is_published = true;
                await smCampaign.save();

                console.log(`Published scheduled smCampaign: ${smCampaign._id}`);
            }
            
        } catch (err) {
            console.error(`Failed to publish post ${smCampaign.id}:`, err);
        }
    }
});