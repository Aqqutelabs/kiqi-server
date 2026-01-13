import { StatusCodes } from "http-status-codes";
import { EmailList, EmailListModel } from "../../models/EmailList";
import { ApiError } from "../../utils/ApiError";
import { EmailListService } from "../emailList.service";
import { ContactDoc, ContactModel } from "../../models/Contacts";
import mongoose from "mongoose";

export class EmailistServiceImpl implements EmailListService{
    async createEmailList(data: { email_listName: string; emails: { email: string; fullName: string }[]; emailFiles: string[]; userId: any;}): Promise<EmailList> {
       let userObjectId;
       if (mongoose.Types.ObjectId.isValid(data.userId)) {
         userObjectId = new mongoose.Types.ObjectId(data.userId);
       } else if (data.userId && data.userId._id && mongoose.Types.ObjectId.isValid(data.userId._id)) {
         userObjectId = new mongoose.Types.ObjectId(data.userId._id);
       } else {
         throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId: must be a valid MongoDB ObjectId");
       }
       const isExists = await EmailListModel.findOne({
        email_listName: data.email_listName,
        userId: userObjectId
       })

       if(isExists){
         throw new ApiError(StatusCodes.BAD_REQUEST, "Email list already exists")
       }

       const newList = await EmailListModel.create({
         email_listName: data.email_listName,
         emails: data.emails,
         emailFiles: data.emailFiles,
         userId: userObjectId,
       })

       return newList;
    }

    async getEmailListsByUser(userId: any): Promise<EmailList[]> {
        let userObjectId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userObjectId = new mongoose.Types.ObjectId(userId);
        } else if (userId && userId._id && mongoose.Types.ObjectId.isValid(userId._id)) {
          userObjectId = new mongoose.Types.ObjectId(userId._id);
        } else {
          throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId: must be a valid MongoDB ObjectId");
        }
        return EmailListModel.find({ userId: userObjectId });
    }
    async getAllEmailLists(): Promise<EmailList[]> {
       return EmailListModel.find();
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
    
    async deleteEmailList(id: string): Promise<void> {
        const emailList = await EmailListModel.findByIdAndDelete(id);
        if (!emailList) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Email list not found");
        }
        // Also delete all associated contacts
        await ContactModel.deleteMany({ groupEmailList: id });
    }
}