import { SenderEmailModel } from "../models/SenderEmail";

export interface SenderEmailService{
    createSenderEmail( sender: String, type: String, email: String, userId?: string): Promise<SenderEmailModel>
    getSenderEmailById(id: String): Promise<SenderEmailModel | null>
    getAllSenderEmails(): Promise<SenderEmailModel[]>
    updateSenderEmail(id: String, data: Partial<{senderName: string, type: string, senderEmail: string}>): Promise<SenderEmailModel>
    deleteSenderEmail(id: String): Promise<void>
    requestVerification(senderName: string, type: string, email: string, userId?: string): Promise<SenderEmailModel>
    verifyOtp(email: string, code: string, userId?: string): Promise<SenderEmailModel>
}