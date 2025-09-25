import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { SenderEmailServiceImpl } from "../services/impl/senderEmail.service.impl";
import { sendgridVerifySender } from '../utils/sendgridVerifySender';

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
      const created = await this.senderEmailService.createSenderEmail( sender, type, email);

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
      const result = await sendgridVerifySender({ nickname, fromEmail, fromName, replyTo, address, city, state, zip, country });
      res.status(StatusCodes.OK).json({
        error: false,
        message: 'Verification request sent to SendGrid',
        data: result,
      });
    } catch (error: any) {
      const response = error?.response;
      if (response && response.data) {
        const apiErrors = response.data.errors;
        if (Array.isArray(apiErrors) && apiErrors.length > 0) {
          res.status(response.status || 400).json({
            error: true,
            message: apiErrors[0].message,
            field: apiErrors[0].field,
            details: apiErrors.length > 1 ? apiErrors : undefined
          });
          return;
        }
        res.status(response.status || 400).json({
          error: true,
          message: response.data.message || 'SendGrid API error',
        });
        return;
      }
      res.status(500).json({
        error: true,
        message: error?.message || 'Internal server error',
      });
    }
  };
}
