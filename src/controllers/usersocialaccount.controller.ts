import { Request, Response } from "express";
import UserSocialAccount from "../models/UserSocialAccount";

export const getUserSocialAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await UserSocialAccount.find().lean();

    return res.json({
      message: "All social accounts retrieved successfully",
      count: accounts.length,
      accounts,
    });
  } catch (error: any) {
    console.error("Failed to get user social accounts:", error);
    return res.status(500).json({
      message: "Failed to retrieve accounts",
      error: error.message,
    });
  }
};

