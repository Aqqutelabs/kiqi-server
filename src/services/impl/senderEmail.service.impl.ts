import { StatusCodes } from "http-status-codes";
import { SenderEmailModel, SenderModel } from "../../models/SenderEmail";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";
import { SenderEmailService } from "../senderEmail.service";


export class SenderEmailServiceImpl implements SenderEmailService{
    async createSenderEmail( senderName: String, type: String, email: String ): Promise<SenderEmailModel> {
        const isUserExist = await SenderModel.findOne({ senderEmail: email });
        if (isUserExist) {
          throw new ApiError(StatusCodes.BAD_REQUEST, "Email already exists");
        }
      
        const sender = await SenderModel.create({
          senderName,     
          type: type,
          senderEmail: email       
        });
      
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
        });
      
        if (!updated) {
          throw new Error("Sender email not found");
        }
      
        return updated;
      }
      
    async deleteSenderEmail(id: String): Promise<void> {
        await SenderModel.findByIdAndDelete(id);
    }
    
}