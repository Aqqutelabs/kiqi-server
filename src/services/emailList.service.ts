import { ContactDoc } from "../models/Contacts"
import { EmailList } from "../models/EmailList"

export interface EmailListService{
    createEmailList(data: { email_listName: string, emails: { email: string; fullName?: string }[],  emailFiles: string[], userId: any }): Promise<EmailList>
    getAllEmailLists(): Promise<EmailList[]>
    getEmailList(id: String): Promise<EmailList | null>
    addEmailListContacts(id: String, data:{}): Promise<ContactDoc>
    deleteEmailListContact(id: String, contactId: string): Promise<void>
    getAllContacts(): Promise<ContactDoc[]>
}