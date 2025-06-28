import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { SenderEmailServiceImpl } from "../services/impl/senderEmail.service.impl";

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
      const updateData = req.body;
      const updated = await this.senderEmailService.updateSenderEmail(id, updateData);

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
}
