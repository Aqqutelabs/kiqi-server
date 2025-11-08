import cron from "node-cron";
import { PostDoc, PostModel } from "../models/Post";
// import { SocialPoster } from "../services/SocialPoster";

// Run every minute
cron.schedule("* * * * *", async () => {
    console.log("Checking for scheduled posts...");

    const now = new Date();

    // Find all posts due for publishing
    const posts = await PostModel.find({
        where: {
            is_draft: false,
            is_published: false,
            publish_date: { $lte: new Date() }
        },
    });

    for (const post of posts) {
        try {
            // Publish it (e.g., to X, Meta, etc.)
            // await SocialPoster.publish(post.platform, post.message, post.file);

            // Mark as published
            post.is_published = true;
            await post.save();

            console.log(`Published scheduled post: ${post.id}`);
        } catch (err) {
            console.error(`Failed to publish post ${post.id}:`, err);
        }
    }
});