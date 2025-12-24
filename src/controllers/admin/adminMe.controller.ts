import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../../models/User";

export const adminMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await UserModel.findById(userId).select(
      "_id firstName lastName email role"
    );

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not found",
      });
    }

    return res.status(StatusCodes.OK).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  } catch (err: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch admin",
    });
  }
};
