import { EmailList } from "../models/EmailList"

export interface EmailListService{
    createEmailList(data: { email_listName: String, emails: [],  emailFiles: [], totalEmails: Number, createdAt: Date }): Promise<EmailList>
    getAllEmailLists(): Promise<EmailList>
    getEmailList(id: String): Promise<EmailList>
    addEmailListContacts(id: String, data:{}): Promise<EmailList>
    deleteEmailListContact(id: String): Promise<void>
    getAllContacts(): Promise<void>
}