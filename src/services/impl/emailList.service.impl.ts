import { StatusCodes } from "http-status-codes";
import { EmailList, EmailListModel } from "../../models/EmailList";
import { ApiError } from "../../utils/ApiError";
import { EmailListService } from "../emailList.service";

export class EmailistServiceImpl implements EmailListService{
    async createEmailList(data: { email_listName: string; emails: string[]; emailFiles: string[];}): Promise<EmailList> {
       const isExists = await EmailListModel.findOne({
        email_listName: data.email_listName
       })

       if(isExists){
         throw new ApiError(StatusCodes.BAD_REQUEST, "Email list already exists")
       }

       const newList = await EmailListModel.create({
         email_listName: data.email_listName,
         emails: data.emails,
         emailFiles: data.emailFiles,
       })

       return newList;
    }
    async getAllEmailLists(): Promise<EmailList[]> {
       return EmailListModel.find()
    }
    async getEmailList(id: String): Promise<EmailList | null> {
        return EmailListModel.findById(id);
    }
    async addEmailListContacts(id: String, data: {}): Promise<EmailList> {
        const isExists = await EmailListModel.findOne()
    }
    async deleteEmailListContact(id: String): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAllContacts(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}