import { StatusCodes } from "http-status-codes";
import { SenderEmailModel, SenderModel } from "../../models/SenderEmail";
import { ApiError } from "../../utils/ApiError";
import { generateAccessToken, generateRefreshToken } from "../../utils/auth.util";
import { AuthService } from "../auth.service";


export class AuthServiceImpl implements AuthService{
   
async login(
    data: {
email: String
}
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sender = await SenderModel.findOne({ senderEmail: data.email });

    if (!sender) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid email");
    }

    const accessToken = generateAccessToken(sender.id, sender.senderEmail);

    const refreshToken = generateRefreshToken(
      sender.id,
      sender.senderEmail,
    );

    return { accessToken, refreshToken };
  }

  async createSenderEmail(data: { sender: String, type: String, email: String }): Promise<SenderEmailModel> {
    const isUserExist = await SenderModel.findOne({ senderEmail: data.email });
  
    if (isUserExist) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Oops, email already taken");
    }
  
    const sender = await SenderModel.create({
      senderName: data.sender, 
      type: data.type,
      senderEmail: data.email,
    });
  
    if (sender) return sender;
  
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Unexpected error during user creation"
    );
  }
  
}