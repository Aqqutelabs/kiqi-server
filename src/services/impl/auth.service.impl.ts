import { StatusCodes } from "http-status-codes";
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
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await UserModel.findOne({ email: data.email });

    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid email");
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Exclude sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return { accessToken, refreshToken, user: userObj };
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
  
  generateAccessTokenForUser(user: User) {
    return generateAccessToken((user._id as any).toString(), user.email);
  }
  generateRefreshTokenForUser(user: User) {
    return generateRefreshToken((user._id as any).toString(), user.email);
  }
}