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
const Post_1 = require("../models/Post");
// import { SocialPoster } from "../services/SocialPoster";
// Run every minute
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Checking for scheduled posts...");
    const now = new Date();
    //const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    //const utcDate = now.toISOString(); // gives UTC
    //const localNow = new Date(now.getTime() + 60 * 60 * 1000);
    // Find all posts due for publishing
    const posts = yield Post_1.PostModel.find({
        is_draft: false,
        is_published: false,
        publish_date: { $lte: now }
    });
    for (const post of posts) {
        try {
            // Publish it (e.g., to X, Meta, etc.)
            // await SocialPoster.publish(post.platform, post.message, post.file);
            // Mark as published
            post.is_published = true;
            yield post.save();
            console.log(`Published scheduled post: ${post.id}`);
        }
        catch (err) {
            console.error(`Failed to publish post ${post.id}:`, err);
        }
    }
}));
