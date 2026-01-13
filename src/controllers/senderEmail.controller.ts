import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { SenderEmailServiceImpl } from "../services/impl/senderEmail.service.impl";
import { verifyEmailSender } from '../utils/emailVerification';
import { sendEmail } from '../utils/EmailService';

export class SenderEmailController {
  private senderEmailService: SenderEmailServiceImpl;

  constructor() {
    this.senderEmailService = new SenderEmailServiceImpl();
  }

  public createSenderEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {

      const { sender, type, email } = req.body;
      const userId = (req as any).user?._id;
      const created = await this.senderEmailService.createSenderEmail( sender, type, email, userId);

      res.status(StatusCodes.CREATED).json({
        error: false,
        message: "Sender email created successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSenderEmailById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const senderEmail = await this.senderEmailService.getSenderEmailById(id);

      if (!senderEmail) {
        res.status(StatusCodes.NOT_FOUND).json({
          error: true,
          message: "Sender email not found",
        });
      }

      res.status(StatusCodes.OK).json({
        error: false,
        data: senderEmail,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllSenderEmails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?._id;
      const senders = await this.senderEmailService.getAllSenderEmails(userId);
      res.status(StatusCodes.OK).json({
        error: false,
        data: senders,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateSenderEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const {senderName, senderEmail, type} = req.body;
      const updated = await this.senderEmailService.updateSenderEmail(id, {
        senderName,
        senderEmail,
        type,
      });
      

      res.status(StatusCodes.OK).json({
        error: false,
        message: "Sender email updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteSenderEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id;
      await this.senderEmailService.deleteSenderEmail(id);

      res.status(StatusCodes.OK).json({
        error: false,
        message: "Sender email deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  public verifySender = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Accept both camelCase and snake_case
      const nickname = req.body.nickname;
      const fromEmail = req.body.fromEmail || req.body.from_email;
      const fromName = req.body.fromName || req.body.from_name;
      const replyTo = req.body.replyTo || req.body.reply_to;
      const address = req.body.address;
      const city = req.body.city;
      const state = req.body.state;
      const zip = req.body.zip;
      const country = req.body.country;

      if (!nickname || !fromEmail || !fromName || !address || !city || !state || !zip || !country) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: true,
          message: "nickname, fromEmail, fromName, address, city, state, zip, and country are required"
        });
        return;
      }

      const result = await verifyEmailSender({ 
        nickname, 
        fromEmail, 
        fromName, 
        replyTo, 
        address, 
        city, 
        state, 
        zip, 
        country 
      });

      res.status(StatusCodes.OK).json({
        error: false,
        message: 'Verification email sent successfully',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  };

  public requestVerificationOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // OTP-based verification flow has been removed. Use SendGrid verification endpoints instead.
    res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: true, message: 'OTP verification is disabled. Use /sendgrid/request-verification' });
  };

  public verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // OTP-based verification flow has been removed. Use SendGrid verification endpoints instead.
    res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: true, message: 'OTP verification is disabled. Use /sendgrid/confirm-verification' });
  };

  // New: request SendGrid verification (creates sender in SendGrid which sends verification email)
  public requestSendGridVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Accept multiple field name variants to be more forgiving of client payloads
      const body = req.body || {};
      const nickname = body.nickname || body.nick || body.name;
      const senderName = body.senderName || body.sender_name || body.fromName || body.from_name || body.sender || body.name;
      const email = body.email || body.from_email || body.fromEmail || body.senderEmail || body.sender_email || body.reply_to;
      const address = body.address || body.addr || '';
      const city = body.city || '';
      const state = body.state || '';
      const zip = body.zip || '';
      const country = body.country || 'US';

      if (!email || !senderName) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'senderName and email are required (accepted keys: senderName, sender_name, fromName, from_name and email, from_email, senderEmail)' });
        return;
      }

      const userId = (req as any).user?._id;
      const sender = await this.senderEmailService.requestSendGridVerification(nickname || senderName, senderName, email, address, city, state, zip, country, userId);

      res.status(StatusCodes.OK).json({ error: false, message: 'SendGrid verification initiated', data: sender });
    } catch (error) {
      next(error);
    }
  };

  // New: confirm SendGrid verification (checks SendGrid and marks local sender verified)
  public confirmSendGridVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body || {};
      const senderId = body.senderId || body.sender_id || body.id;
      const token = body.token || body.verifyToken || body.verification_token;

      const userId = (req as any).user?._id;

      let sender;
      if (token) {
        sender = await this.senderEmailService.confirmSendGridVerificationByToken(token, userId);
      } else if (senderId) {
        sender = await this.senderEmailService.confirmSendGridVerification(senderId, userId);
      } else {
        res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'senderId or token is required' });
        return;
      }

      res.status(StatusCodes.OK).json({ error: false, message: 'Sender verified', data: sender });
    } catch (error) {
      next(error);
    }
  };

  // New: retrieve the user's verified SendGrid sender email
  public getUserVerifiedSender = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: true, message: 'Not authenticated' });
        return;
      }
      const sender = await this.senderEmailService.getUserVerifiedSender(userId);
      if (!sender) {
        res.status(StatusCodes.NOT_FOUND).json({ error: true, message: 'No verified sender found for user' });
        return;
      }
      res.status(StatusCodes.OK).json({ error: false, message: 'Verified sender found', data: sender });
    } catch (error) {
      next(error);
    }
  };
}
