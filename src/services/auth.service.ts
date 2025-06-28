import { SenderEmailModel } from "../models/SenderEmail";
import { User } from "../models/User";

export interface AuthService {
    login(data: {email: string, password: string}): Promise<{ accessToken: string; refreshToken: string }>;
    createUser(data: {firstName: string, lastName: string, email: string, password: string}): Promise<User>;
  }