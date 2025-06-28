import { SenderEmailModel } from "../models/SenderEmail";

export interface AuthService {
    login(data: {email: String}): Promise<{ accessToken: string; refreshToken: string }>;
    createSenderEmail(data: {sender: String, type: String, email: String}): Promise<SenderEmailModel>;
  }