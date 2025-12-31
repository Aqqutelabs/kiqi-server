import { Request, Response, Router } from "express";
import axios from "axios";
import { isAuthenticated } from "../middlewares/Auth.middlewares";
import UserSocialAccount from "../models/UserSocialAccount";

const router = Router();

// Step 1: Start Instagram OAuth flow
router.get("/auth/instagram", async (req: Request, res: Response) => {
  try {
    const clientId = process.env.META_APP_ID!;
    const redirectUri = process.env.META_REDIRECT_URI!;

    const scope = [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
    ].join(",");

    const authUrl =
      "https://www.instagram.com/oauth/authorize" +
      `?force_reauth=true` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}`;

    console.log("------ INSTAGRAM AUTH START ------");
    console.log("Redirecting user to:");
    console.log(authUrl);
    console.log("redirectUri from ENV:", redirectUri);
    console.log("----------------------------------");

    res.redirect(authUrl);
  } catch (err) {
    console.error("Error redirecting to Instagram OAuth:", err);
    res.status(500).json({ error: "Failed to start Instagram login" });
  }
});



// // Step 2: Callback

router.get("/auth/instagram/callback", isAuthenticated, async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!req.user)
    return res.status(401).json({ message: "Unauthorized" });
  const user = req.user;


  if (!code)
    return res.status(400).json({ error: "Missing code" });

  try {
    const clientId = process.env.META_APP_ID!;
    const clientSecret = process.env.META_APP_SECRET!;
    const redirectUri = process.env.META_REDIRECT_URI!;

    // Step 1: Exchange for short-lived token
    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code as string,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const shortLivedToken = tokenRes.data.access_token;

    // Step 2: Exchange for long-lived token
    const longLivedRes = await axios.get("https://graph.instagram.com/access_token", {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: clientSecret,
        access_token: shortLivedToken,
      },
    });

    const longLivedToken = longLivedRes.data.access_token;
    const expiresIn = longLivedRes.data.expires_in;

    // Step 3: Get user info
    const userInfo = await axios.get("https://graph.instagram.com/v24.0/me", {
      params: {
        fields: "id,username",
        access_token: longLivedToken,
      },
    });

    // Step 4: Save or update in MongoDB
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const existingAccount = await UserSocialAccount.findOne({
      user_id: user.id,
      platform: "instagram",
    });

    if (existingAccount) {
      existingAccount.access_token = longLivedToken;
      existingAccount.token_expires_at = expiresAt;
      existingAccount.account_id = userInfo.data.id;
      existingAccount.username = userInfo.data.username;
      await existingAccount.save();
    } else {
      await UserSocialAccount.create({
        user_id: user.id,
        platform: "instagram",
        access_token: longLivedToken,
        token_expires_at: expiresAt,
        account_id: userInfo.data.id,
        username: userInfo.data.username,
      });
    }

    res.json({
      success: true,
      user: userInfo.data,
      access_token: longLivedToken,
      expires_in: expiresIn,
    });
  } catch (error: any) {
    console.error("Error exchanging Instagram token:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to handle Instagram callback" });
  }
});

// router.get("/auth/instagram/callback", async (req: Request, res: Response) => {
//   const { code } = req.query;

//   console.log("------ INSTAGRAM CALLBACK ------");
//   console.log("code:", code);
//   console.log("redirectUri from ENV:", process.env.META_REDIRECT_URI);
//   console.log("--------------------------------");

//   if (!code) {
//     return res.status(400).json({ error: "Missing code from Instagram callback" });
//   }

//   try {
//     const clientId = process.env.META_APP_ID!;
//     const clientSecret = process.env.META_APP_SECRET!;
//     const redirectUri = process.env.META_REDIRECT_URI!;

//     console.log("Exchanging code for access token...");
//     console.log("POST to https://api.instagram.com/oauth/access_token with:");
//     console.log({
//       client_id: clientId,
//       client_secret: clientSecret,
//       redirect_uri: redirectUri,
//       code,
//     });

//     const tokenRes = await axios.post(
//       "https://api.instagram.com/oauth/access_token",
//       new URLSearchParams({
//         client_id: clientId,
//         client_secret: clientSecret,
//         grant_type: "authorization_code",
//         redirect_uri: redirectUri,
//         code: code as string,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     console.log("Token exchange successful:", tokenRes.data);

//     const shortLivedToken = tokenRes.data.access_token;

//     const longLivedRes = await axios.get(
//       "https://graph.instagram.com/access_token",
//       {
//         params: {
//           grant_type: "ig_exchange_token",
//           client_secret: clientSecret,
//           access_token: shortLivedToken,
//         },
//       }
//     );

//     console.log("Long-lived token result:", longLivedRes.data);

//     res.json({
//       success: true,
//       shortLivedToken,
//       longLivedToken: longLivedRes.data.access_token,
//       expires_in: longLivedRes.data.expires_in,
//     });
//   } catch (error: any) {
//     console.error("Error getting Instagram access token:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to exchange code for access token" });
//   }
// });

// // Get user name
// router.get("/auth/instagram/user", async (req: Request, res: Response) => {
//   try {
//     const accessToken = req.query.access_token as string;

//     if (!accessToken) {
//       return res.status(400).json({ error: "Missing access_token" });
//     }

//     // Call Instagram Graph API to get the user_id and username
//     const response = await axios.get("https://graph.instagram.com/v24.0/me", {
//       params: {
//         fields: "id,username",
//         access_token: accessToken,
//       },
//     });

//     res.json({
//       success: true,
//       user: response.data,
//     });
//   } catch (err: any) {
//     console.error(
//       "Error fetching Instagram user info:",
//       err.response?.data || err.message
//     );
//     res.status(500).json({ error: "Failed to get Instagram user info" });
//   }
// });


export default router;
