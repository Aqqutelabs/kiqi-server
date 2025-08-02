import { SenderEmailModel } from "../models/SenderEmail";

export interface SenderEmailService{
    createSenderEmail( sender: String, type: String, email: String): Promise<SenderEmailModel>
    getSenderEmailById(id: String): Promise<SenderEmailModel | null>
    getAllSenderEmails(): Promise<SenderEmailModel[]>
    updateSenderEmail(id: String, data: Partial<{sender: String, type: String, email: String}>): Promise<SenderEmailModel>
    deleteSenderEmail(id: String): Promise<void>
}