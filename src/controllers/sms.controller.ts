import { Request, Response, NextFunction } from 'express';
import { SmsServiceImpl } from '../services/impl/sms.service.impl';
import { StatusCodes } from 'http-status-codes';

export class SmsController {
  private smsService: SmsServiceImpl;
  constructor() {
    this.smsService = new SmsServiceImpl();
  }

  public createSender = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, sampleMessage } = req.body;
      const userId = req.user?._id;
      const sender = await this.smsService.createSender(name, sampleMessage, userId);
      res.status(StatusCodes.CREATED).json({ error: false, data: sender });
    } catch (err) { next(err); }
  }

  public getSenders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const list = await this.smsService.getSendersByUser(userId);
      res.status(StatusCodes.OK).json({ error: false, data: list });
    } catch (err) { next(err); }
  }

  public createRecipientGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, contacts } = req.body; // contacts: string[]
      const userId = req.user?._id;
      const group = await this.smsService.createRecipientGroup(name, contacts || [], userId);
      res.status(StatusCodes.CREATED).json({ error: false, data: group });
    } catch (err) { next(err); }
  }

  public getRecipientGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const groups = await this.smsService.getRecipientGroups(userId);
      res.status(StatusCodes.OK).json({ error: false, data: groups });
    } catch (err) { next(err); }
  }

  public sendNow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recipients, message, senderId } = req.body; // recipients: array
      const sender = senderId ? await this.smsService.getSendersByUser(req.user?._id) : null;
      const from = senderId ? undefined : undefined; // placeholder - Twilio from is configured via env
      const result = await this.smsService.sendBulkSms(recipients, message, from);
      res.status(StatusCodes.OK).json({ error: false, data: result });
    } catch (err) { next(err); }
  }
}
