import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { OAuth2Client } from 'google-auth-library';
import { AuthServiceImpl } from "../services/impl/auth.service.impl";

export class AuthController {
  private authService: AuthServiceImpl;

  constructor() {
    this.authService = new AuthServiceImpl();
  }

  
  public updateSenderEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      console.log('Update Sender Email - Request Body:', req.body);
      console.log('Update Sender Email - User:', req.user);
      // Get userId from req.user (set by auth middleware)
      const userId = req.user?._id || req.user?.id;
      const { senderEmail } = req.body;
      if (!senderEmail) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: true,
          message: "Sender email is required"
        });
        return;
      }
      // Validate email format
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(senderEmail)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: true,
          message: "Invalid sender email format"
        });
        return;
      }
      const { UserModel } = await import("../models/User");
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { senderEmail },
        { new: true }
      );
      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          error: true,
          message: "User not found"
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        error: false,
        message: "Sender email updated successfully",
        user
      });
    } catch (error) {
      next(error);
    }
  }

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login({ email, password });
      res.status(StatusCodes.CREATED).json({
        error: false,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  public createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { firstName, lastName, email, password, organizationName } = req.body;
      const user = await this.authService.createUser({ firstName, lastName, email, password, organizationName });
      const accessToken = this.authService.generateAccessTokenForUser(user);
      res.status(StatusCodes.CREATED).json({
        error: false,
        message: `User registered successfully. Email: ${user.email}`,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  public googleSignIn = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'idToken is required' });
        return;
      }
      // Verify token with Google (log verification errors for debugging)
      let profile = null;
      try {
        profile = await verifyGoogleToken(idToken);
      } catch (verifyErr) {
        console.error('Google token verification error:', (verifyErr as Error)?.message || verifyErr);
      }

      if (!profile) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: true, message: 'Invalid Google ID token' });
        return;
      }
      const email: string = profile.email || '';
      const firstName: string = profile.given_name || profile.name || 'Unknown';
      const lastName: string = profile.family_name || '';
      const googleId: string = profile.sub || '';

      const { UserModel } = await import('../models/User');

      let user = await UserModel.findOne({ email });
      if (user) {
        // update google id if missing
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        // create user with a random password (social login)
        const randomPassword = Math.random().toString(36).slice(2, 12);
        user = await UserModel.create({
          firstName,
          lastName: lastName || ' ',
          email,
          password: randomPassword,
          organizationName: '' ,
          googleId
        });
      }

      // generate tokens
      const accessToken = this.authService.generateAccessTokenForUser(user as any);
      const refreshToken = this.authService.generateRefreshTokenForUser(user as any);

      const userObj = (user as any).toObject ? (user as any).toObject() : user;
      if (userObj.password) delete userObj.password;

      res.status(StatusCodes.OK).json({ error: false, message: 'Signed in with Google', accessToken, refreshToken, user: userObj });
    } catch (err) {
      next(err);
    }
  }
}

// Google OAuth2 client + helpers
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "https://gokiki.app"
);

export async function getGoogleTokens(req: Request, res: Response) {
  const code = (req.query.code as string) || req.body?.code;

  try {
    const { tokens } = await googleClient.getToken(code);
    res.json({ success: true, tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Token exchange failed" });
  }
}

export async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  return ticket.getPayload();
}
