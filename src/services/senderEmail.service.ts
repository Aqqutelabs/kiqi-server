import { SenderEmailModel } from "../models/SenderEmail";

export interface SenderEmailService{
    createSenderEmail( sender: String, type: String, email: String, userId?: string): Promise<SenderEmailModel>
    getSenderEmailById(id: String): Promise<SenderEmailModel | null>
    getAllSenderEmails(): Promise<SenderEmailModel[]>
    updateSenderEmail(id: String, data: Partial<{senderName: string, type: string, senderEmail: string}>): Promise<SenderEmailModel>
    deleteSenderEmail(id: String): Promise<void>
    // OTP-based verification removed. Use SendGrid verification methods below.
    requestSendGridVerification(nickname: string, senderName: string, email: string, address?: string, city?: string, state?: string, zip?: string, country?: string, userId?: string): Promise<SenderEmailModel>
    confirmSendGridVerification(localSenderId: string, userId?: string): Promise<SenderEmailModel>
    confirmSendGridVerificationByToken(token: string, userId?: string): Promise<SenderEmailModel>
    getUserVerifiedSender(userId: string): Promise<SenderEmailModel | null>
}