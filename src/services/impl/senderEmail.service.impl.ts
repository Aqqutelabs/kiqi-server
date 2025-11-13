import { StatusCodes } from "http-status-codes";
import { SenderEmailModel, SenderModel } from "../../models/SenderEmail";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";
import { SenderEmailService } from "../senderEmail.service";
import bcrypt from 'bcrypt';


export class SenderEmailServiceImpl implements SenderEmailService{
    async createSenderEmail( senderName: String, type: String, email: String, userId?: string ): Promise<SenderEmailModel> {
        const isUserExist = await SenderModel.findOne({ senderEmail: email });
        if (isUserExist) {
          throw new ApiError(StatusCodes.BAD_REQUEST, "Email already exists");
        }

        const payload: any = {
          senderName,
          type: type,
          senderEmail: email,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        if (userId) payload.user_id = userId;

        const sender = await SenderModel.create(payload);

        return sender;
      }
      
    async getSenderEmailById(id: String): Promise<SenderEmailModel | null> {
        return SenderModel.findById(id);
    }
    getAllSenderEmails(): Promise<SenderEmailModel[]> {
        return SenderModel.find();
    }
    async updateSenderEmail(
        id: string,
        data: Partial<{ senderName: string; type: string; senderEmail: string }>
      ): Promise<SenderEmailModel> {
        const updated = await SenderModel.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
          updatedAt: Date.now()
        });
      
        if (!updated) {
          throw new Error("Sender email not found");
        }
      
        return updated;
      }
      
    async deleteSenderEmail(id: String): Promise<void> {
        await SenderModel.findByIdAndDelete(id);
    }
    
  async requestVerification(senderName: string, type: string, email: string, userId?: string): Promise<SenderEmailModel> {
    // generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const codeHash = await bcrypt.hash(code, 10);

    let sender = await SenderModel.findOne({ senderEmail: email });
    if (!sender) {
      sender = await SenderModel.create({ senderName, type, senderEmail: email, user_id: userId, verified: false, verificationCode: codeHash, verificationExpires: expires });
    } else {
      // update code hash and expiry
      sender.verificationCode = codeHash as any;
      sender.verificationExpires = expires as any;
      sender.verified = false;
      if (userId) sender.user_id = userId as any;
      await sender.save();
    }

    // attach raw code to return value for sending via email (not saved)
    const ret = sender.toObject ? sender.toObject() : { ...sender } as any;
    ret.verificationCode = code;
    return ret as any;
  }

  async verifyOtp(email: string, code: string, userId?: string): Promise<SenderEmailModel> {
    const sender = await SenderModel.findOne({ senderEmail: email });
    if (!sender) throw new ApiError(StatusCodes.NOT_FOUND, 'Sender email not found');

    if (userId && sender.user_id && sender.user_id.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You do not own this sender email');
    }

    const isMatch = await bcrypt.compare(code, sender.verificationCode as string);
    if (!isMatch) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid verification code');
    }

    if (!sender.verificationExpires || new Date() > new Date(sender.verificationExpires)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification code expired');
    }

    sender.verified = true;
    sender.verificationCode = undefined as any;
    sender.verificationExpires = undefined as any;
    await sender.save();

    return sender;
  }
    
}