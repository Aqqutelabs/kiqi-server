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

  async createUser(data: { firstName: string, lastName: string, email: string, password: string, organizationName: string }): Promise<User> {
    const isUserExist = await UserModel.findOne({ email: data.email });
  
    if (isUserExist) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Oops, email already taken");
    }
  
    const user = await UserModel.create({
      firstName: data.firstName, 
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      organizationName: data.organizationName
    });
  
    if (user) return user;
  
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Unexpected error during user creation"
    );
  }
  
}