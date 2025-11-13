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
      const senders = await this.senderEmailService.getAllSenderEmails();
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
    try {
      const { senderName, type, email } = req.body;
      if (!email) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'email is required' });
        return;
      }
      const userId = (req as any).user?._id;
      const sender = await this.senderEmailService.requestVerification(senderName || 'Sender', type || 'default', email, userId);

      // send otp via email
      const code = (sender as any).verificationCode;
      const html = `<p>Your verification code is <strong>${code}</strong>. It expires in 15 minutes.</p>`;
      await sendEmail({ to: email, subject: 'Verify your sender email', text: `Your code: ${code}`, html });

      res.status(StatusCodes.OK).json({ error: false, message: 'Verification code sent', data: { email } });
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'email and code are required' });
        return;
      }
      const userId = (req as any).user?._id;
      const sender = await this.senderEmailService.verifyOtp(email, code.toString(), userId);

      res.status(StatusCodes.OK).json({ error: false, message: 'Email verified successfully', data: sender });
    } catch (error) {
      next(error);
    }
  };
}
