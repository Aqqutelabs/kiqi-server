import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { UserModel } from "../../models/User";
import { asyncHandler } from "../../utils/AsyncHandler";

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Admin users may be identified by role = 'admin' in the same User table
    const user = await UserModel.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User must be an admin",
      });
    }

    // Since passwords are currently plain text
    const isValid = password === user.password;

    if (!isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "",
      { expiresIn: "1d" }
    );

    res.status(StatusCodes.OK).json({
      message: "Admin logged in successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: err.message,
    });
  }
};

export const adminLogout = asyncHandler(async (req: any, res: Response) => {
  // Only needed if you store refresh tokens in DB
  if (req.user?.id) {
    await UserModel.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
  }

  res.status(200).json({
    message: "Admin logged out successfully",
  });
});
