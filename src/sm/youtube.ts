import { Request, Response, Router } from "express";
import { google } from "googleapis";
import crypto from "crypto";
import UserSocialAccount from "../models/UserSocialAccount";
import { UserModel } from "../models/User";
import { isAuthenticated } from "../middlewares/Auth.middlewares";
import multer from "multer";

const router = Router();

const upload = multer({ dest: "uploads/" });

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly"
];

// Step 1: Connect to youtube
router.get("/auth/youtube", async (req, res) => {
  try {
    // if (!req.user)
    //   return res.status(401).json({ message: "Unauthorized" });

    const loggedUser = '6911c84cab9272f6f4a364ce';

    const state = JSON.stringify({ userId: loggedUser });
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",        // force consent screen for now
      scope: scopes,
      state
    });

    return res.redirect(url);
  } catch (error: any) {
    console.error("Failed to generate Google OAuth URL:", error);
    return res.status(500).json({
      message: "Failed to initiate YouTube authentication",
      error: error.message,
    });
  }
});

// Step 2
router.get("/auth/youtube/callback", async (req, res) => {
  try {
    const stateString = req.query.state as string;
    if (!stateString) return res.status(400).send("Missing state");

    const { userId } = JSON.parse(stateString);

    const user = await UserModel.findById(userId);

    const rawCode = req.query.code;
    let code: string;

    if (typeof rawCode === "string") {
      code = rawCode;
    } else if (Array.isArray(rawCode) && typeof rawCode[0] === "string") {
      code = rawCode[0];
    } else {
      return res.status(400).json({ message: "Invalid code format" });
    }

    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;

    oauth2Client.setCredentials(tokens);

    const { access_token, refresh_token, expiry_date } = tokenResponse.tokens;


    // GET USER INFO FROM YOUTUBE
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const channelResponse = await youtube.channels.list({
      part: ["id", "snippet"],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];

    const youtubeChannelId = channel?.id || null;
    const youtubeChannelTitle = channel?.snippet?.title || null;

    if (user) {
      const existingAccount = await UserSocialAccount.findOne({
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

        await existingAccount.save();
      } else {
        await UserSocialAccount.create({
          user_id: user.id,
          platform: "youtube",
          access_token,
          refresh_token,
          token_expires_at: expiry_date ? new Date(expiry_date) : undefined,
          account_id: youtubeChannelId || null,
          username: youtubeChannelTitle || null,
        });
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "YouTube account connected successfully!",
      channel_id: youtubeChannelId,
      channel_title: youtubeChannelTitle,
      access_token,
      refresh_token,
    });

  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return res.status(500).json({
      message: "Failed to complete YouTube authentication",
      error: error.message,
    });
  }
});

router.post(
  "/youtube/upload",
  isAuthenticated,
  upload.single("video"),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user;

      // Get connected YouTube account
      const account = await UserSocialAccount.findOne({
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
      const newAccessToken = await oauth2Client.getAccessToken();

      // If refresh failed
      if (!newAccessToken?.token) {
        console.log("Token refresh FAILED");
        return res.status(401).json({
          message: "Unable to refresh YouTube access token",
        });
      }

      // Save refreshed token
      account.access_token = newAccessToken.token;
      await account.save();

      const youtube = google.youtube({
        version: "v3",
        auth: oauth2Client,
      });

      if (!req.file) {
        return res.status(400).json({ message: "No video uploaded" });
      }

      const { title, description } = req.body;
      const fs = require("fs");

      // Insert video
      const response = await youtube.videos.insert({
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

    } catch (error: any) {
      console.error("YouTube upload error:", error);

      return res.status(500).json({
        message: "Video upload failed",
        error:
          error.message ||
          error.response?.data?.error ||
          "Unknown YouTube API error",
      });
    }
  }
);



export default router;
