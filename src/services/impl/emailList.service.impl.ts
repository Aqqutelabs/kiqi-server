import { StatusCodes } from "http-status-codes";
import { EmailList, EmailListModel } from "../../models/EmailList";
import { ApiError } from "../../utils/ApiError";
import { EmailListService } from "../emailList.service";
import { ContactDoc, ContactModel } from "../../models/Contacts";

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
    async addEmailListContacts(id: String, data: {firstName: string, lastName: string, emailAddress: string, phoneNumber: string, groupEmailList: string}): Promise<ContactDoc> {
        const isEmailListExists = await EmailListModel.findById({
            id
        })
        if(isEmailListExists){
           throw new ApiError(StatusCodes.BAD_REQUEST, "Email List does not exist")
        }

        const newContact = await ContactModel.create({
            firstName: data.firstName,
            lastName: data.lastName,
            emailAddress: data.emailAddress,
            phoneNumber: data.phoneNumber,
            groupEmailList: data.groupEmailList
        })

        return newContact
    }
    async deleteEmailListContact(id: String, contactId: string): Promise<void> {
        const isEmailListExists = await EmailListModel.findById({
            id
        });
        if(isEmailListExists){
            throw new ApiError(StatusCodes.BAD_REQUEST, "Email List does not exist")
        }

        await ContactModel.findByIdAndDelete(contactId)
    }
    async getAllContacts(): Promise<ContactDoc[]> {
        return await ContactModel.find()
    }
    
}