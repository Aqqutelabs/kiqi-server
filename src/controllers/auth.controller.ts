import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
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
}

// hpe
