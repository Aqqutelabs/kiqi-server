import { EmailList } from "../models/EmailList"

export interface EmailListService{
    createEmailList(data: { email_listName: String, emails: [],  emailFiles: [] }): Promise<EmailList>
    getAllEmailLists(): Promise<EmailList[]>
    getEmailList(id: String): Promise<EmailList | null>
    addEmailListContacts(id: String, data:{}): Promise<EmailList>
    deleteEmailListContact(id: String): Promise<void>
    getAllContacts(): Promise<void>
}