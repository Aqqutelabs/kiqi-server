import { StatusCodes } from "http-status-codes";
import { SenderEmailModel, SenderModel } from "../../models/SenderEmail";
import { ApiError } from "../../utils/ApiError";
import { generateAccessToken, generateRefreshToken } from "../../utils/auth.util";
import { AuthService } from "../auth.service";
import { User, UserModel } from "../../models/User";


export class AuthServiceImpl implements AuthService{
   
async login(
    data: {
email: string,
password: string
}
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await UserModel.findOne({ email: data.email });

    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid email");
    }

    const accessToken = generateAccessToken(user.id, user.email);

    const refreshToken = generateRefreshToken(
      user.id,
      user.email,
    );

    return { accessToken, refreshToken };
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName: string;
  }): Promise<User> {
    const { firstName, lastName, email, password, organizationName } = data;
  
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Oops, email already taken");
    }
  
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password, // Ensure this is hashed in middleware or before this call
      organizationName,
    });
  
    if (!user) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Unexpected error during user creation"
      );
    }
  
    return user;
  }
  
  
}