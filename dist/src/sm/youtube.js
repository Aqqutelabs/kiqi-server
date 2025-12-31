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
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const UserSocialAccount_1 = __importDefault(require("../models/UserSocialAccount"));
const User_1 = require("../models/User");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: "uploads/" });
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, process.env.YOUTUBE_REDIRECT_URI);
const scopes = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
];
// Step 1: Connect to youtube
router.get("/auth/youtube", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // if (!req.user)
        //   return res.status(401).json({ message: "Unauthorized" });
        const loggedUser = '6911c84cab9272f6f4a364ce';
        const state = JSON.stringify({ userId: loggedUser });
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent", // force consent screen for now
            scope: scopes,
            state
        });
        return res.redirect(url);
    }
    catch (error) {
        console.error("Failed to generate Google OAuth URL:", error);
        return res.status(500).json({
            message: "Failed to initiate YouTube authentication",
            error: error.message,
        });
    }
}));
// Step 2
router.get("/auth/youtube/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const stateString = req.query.state;
        if (!stateString)
            return res.status(400).send("Missing state");
        const { userId } = JSON.parse(stateString);
        const user = yield User_1.UserModel.findById(userId);
        const rawCode = req.query.code;
        let code;
        if (typeof rawCode === "string") {
            code = rawCode;
        }
        else if (Array.isArray(rawCode) && typeof rawCode[0] === "string") {
            code = rawCode[0];
        }
        else {
            return res.status(400).json({ message: "Invalid code format" });
        }
        const tokenResponse = yield oauth2Client.getToken(code);
        const tokens = tokenResponse.tokens;
        oauth2Client.setCredentials(tokens);
        const { access_token, refresh_token, expiry_date } = tokenResponse.tokens;
        // GET USER INFO FROM YOUTUBE
        const youtube = googleapis_1.google.youtube({
            version: "v3",
            auth: oauth2Client,
        });
        const channelResponse = yield youtube.channels.list({
            part: ["id", "snippet"],
            mine: true,
        });
        const channel = (_a = channelResponse.data.items) === null || _a === void 0 ? void 0 : _a[0];
        const youtubeChannelId = (channel === null || channel === void 0 ? void 0 : channel.id) || null;
        const youtubeChannelTitle = ((_b = channel === null || channel === void 0 ? void 0 : channel.snippet) === null || _b === void 0 ? void 0 : _b.title) || null;
        if (user) {
            const existingAccount = yield UserSocialAccount_1.default.findOne({
                user_id: user.id,
                platform: "youtube",
            });
            if (existingAccount) {
                existingAccount.access_token = access_token || existingAccount.access_token;
                if (refresh_token) {
                    existingAccount.refresh_token = refresh_token;
                }
                existingAccount.token_expires_at = expiry_date
                    ? new Date(expiry_date)
                    : existingAccount.token_expires_at;
                existingAccount.account_id = youtubeChannelId || existingAccount.account_id;
                existingAccount.username = youtubeChannelTitle || existingAccount.username;
                yield existingAccount.save();
            }
            else {
                yield UserSocialAccount_1.default.create({
                    user_id: user.id,
                    platform: "youtube",
                    access_token,
                    refresh_token,
                    token_expires_at: expiry_date ? new Date(expiry_date) : undefined,
                    account_id: youtubeChannelId || null,
                    username: youtubeChannelTitle || null,
                });
            }
        }
        else {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({
            message: "YouTube account connected successfully!",
            channel_id: youtubeChannelId,
            channel_title: youtubeChannelTitle,
            access_token,
            refresh_token,
        });
    }
    catch (error) {
        console.error("OAuth callback error:", error);
        return res.status(500).json({
            message: "Failed to complete YouTube authentication",
            error: error.message,
        });
    }
}));
router.post("/youtube/upload", Auth_middlewares_1.isAuthenticated, upload.single("video"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const user = req.user;
        // Get connected YouTube account
        const account = yield UserSocialAccount_1.default.findOne({
            user_id: user._id,
            platform: "youtube",
        });
        if (!account) {
            return res.status(404).json({
                message: "You have not connected a YouTube account yet",
            });
        }
        // Restore credentials
        oauth2Client.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
        });
        // refresh access token
        const newAccessToken = yield oauth2Client.getAccessToken();
        // If refresh failed
        if (!(newAccessToken === null || newAccessToken === void 0 ? void 0 : newAccessToken.token)) {
            console.log("Token refresh FAILED");
            return res.status(401).json({
                message: "Unable to refresh YouTube access token",
            });
        }
        // Save refreshed token
        account.access_token = newAccessToken.token;
        yield account.save();
        const youtube = googleapis_1.google.youtube({
            version: "v3",
            auth: oauth2Client,
        });
        if (!req.file) {
            return res.status(400).json({ message: "No video uploaded" });
        }
        const { title, description } = req.body;
        const fs = require("fs");
        // Insert video
        const response = yield youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: title || "Untitled Video",
                    description: description || "Uploaded via API",
                },
                status: {
                    privacyStatus: "public",
                },
            },
            media: {
                body: fs.createReadStream(req.file.path),
            },
        });
        // Delete temp uploaded file
        fs.unlinkSync(req.file.path);
        const videoId = response.data.id;
        return res.json({
            message: "Video uploaded successfully!",
            videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
        });
    }
    catch (error) {
        console.error("YouTube upload error:", error);
        return res.status(500).json({
            message: "Video upload failed",
            error: error.message ||
                ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) ||
                "Unknown YouTube API error",
        });
    }
}));
exports.default = router;
