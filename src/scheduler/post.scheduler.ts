import cron from "node-cron";
import { PostDoc, PostModel } from "../models/Post";
// import { SocialPoster } from "../services/SocialPoster";

// Run every minute
cron.schedule("* * * * *", async () => {
    console.log("Checking for scheduled posts...");

    const now = new Date();
    //const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    //const utcDate = now.toISOString(); // gives UTC
    //const localNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find all posts due for publishing
    const posts = await PostModel.find({
        is_draft: false,
        is_published: false,
        publish_date: { $lte: now }
    });

    for (const post of posts) {
        try {
            // Publish it (e.g., to X, Meta, etc.)
            // await SocialPoster.publish(post.platform, post.message, post.file);

            // Mark as published
            // post.is_published = true;
            await post.save();

            console.log(`Published scheduled post: ${post.id}`);
        } catch (err) {
            console.error(`Failed to publish post ${post.id}:`, err);
        }
    }
});