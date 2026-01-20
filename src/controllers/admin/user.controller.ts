import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../../models/User";

// Create a user
export const createUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, organizationName, role } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Email already exists" });
    }

    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password, // plain text for now, hash later
      organizationName,
      role: role || "user", // allow setting role
    });

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
    });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

// Get all users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().select("-password -refreshToken -walletAddress"); // never send password
    const response = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.status(StatusCodes.OK).json({ users: response });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

// Get a single user by ID
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id).select("-password -refreshToken -walletAddress");
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
    res.status(StatusCodes.OK).json({ user });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  console.log("req.body:", req.body);

  const { id } = req.params;
  const updateData = { ...req.body };

  // Prevent role from being updated
  if ("role" in updateData) delete updateData.role;

  try {
    // Find user by ID
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
    }

    // Merge updateData into user document
    console.log("Update data:", updateData);
    Object.assign(user, updateData);
    console.log("User before save:", user.toObject());

    // Save the user (triggers pre-save hooks if any)
    await user.save();

    // Sanitize sensitive fields
    const { password, refreshToken, walletAddress, ...safeUser } = user.toObject();

    res.status(StatusCodes.OK).json({
      message: "User updated successfully",
      user: safeUser,
    });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Something went wrong",
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
    res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};
