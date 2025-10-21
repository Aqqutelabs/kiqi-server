import { Request, Response, NextFunction } from 'express';
import { SmsServiceImpl } from '../services/impl/sms.service.impl';
import { StatusCodes } from 'http-status-codes';

class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

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

  public updateSender = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const { name, sampleMessage } = req.body;
      const updated = await this.smsService.updateSender(id, { name, sampleMessage });
      res.status(StatusCodes.OK).json({ error: false, data: updated });
    } catch (err) { next(err); }
  }

  public deleteSender = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      await this.smsService.deleteSender(id);
      res.status(StatusCodes.OK).json({ error: false, message: 'Sender deleted' });
    } catch (err) { next(err); }
  }

  public sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, body, from } = req.body;
      if (!to || !body) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing required fields: to, body');
      }
      const result = await this.smsService.sendMessage(to, body, from);
      res.status(StatusCodes.OK).json({ error: false, data: result });
    } catch (err) { next(err); }
  }

  public createRecipientGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      let contacts: string[] = [];
      // Accept contacts from body (JSON array or comma-separated string)
      if (Array.isArray(req.body.contacts)) {
        contacts = req.body.contacts;
      } else if (typeof req.body.contacts === 'string') {
        contacts = req.body.contacts.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      // If a CSV file is uploaded, parse it and extract phone numbers
      if (req.file && req.file.buffer) {
        const { parse } = require('csv-parse/sync');
        const csvRows = parse(req.file.buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true });
        // Accept columns: phone, Phone, phoneNumber, PhoneNumber
        const csvContacts = csvRows.map((row: any) => row.phone || row.Phone || row.phoneNumber || row.PhoneNumber).filter((n: any) => !!n);
        contacts = contacts.concat(csvContacts);
      }
      // Remove duplicates and empty
      contacts = Array.from(new Set(contacts)).filter(Boolean);
      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'Group name is required.' });
      }
      if (contacts.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'At least one contact must be provided, either manually or via CSV upload.' });
      }
      const userId = req.user?._id;
      const group = await this.smsService.createRecipientGroup(name, contacts, userId);
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

  public updateRecipientGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const { name, contacts } = req.body;
      const updated = await this.smsService.updateRecipientGroup(id, { name, contacts });
      res.status(StatusCodes.OK).json({ error: false, data: updated });
    } catch (err) { next(err); }
  }

  public deleteRecipientGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      await this.smsService.deleteRecipientGroup(id);
      res.status(StatusCodes.OK).json({ error: false, message: 'Recipient group deleted' });
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

  // Templates
  public createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, message } = req.body;
      if (!title || !message) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'Title and message are required' });
      }
      const userId = req.user?._id;
      const tpl = await this.smsService.createTemplate(title, message, userId);
      res.status(StatusCodes.CREATED).json({ error: false, data: tpl });
    } catch (err) { next(err); }
  }

  public getTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const list = await this.smsService.getTemplates(userId);
      res.status(StatusCodes.OK).json({ error: false, data: list });
    } catch (err) { next(err); }
  }

  public getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const tpl = await this.smsService.getTemplateById(id);
      if (!tpl) return res.status(StatusCodes.NOT_FOUND).json({ error: true, message: 'Template not found' });
      res.status(StatusCodes.OK).json({ error: false, data: tpl });
    } catch (err) { next(err); }
  }

  public updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const { title, message } = req.body;
      const updated = await this.smsService.updateTemplate(id, { title, message });
      res.status(StatusCodes.OK).json({ error: false, data: updated });
    } catch (err) { next(err); }
  }

  public deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      await this.smsService.deleteTemplate(id);
      res.status(StatusCodes.OK).json({ error: false, message: 'Template deleted' });
    } catch (err) { next(err); }
  }

  public sendTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const { recipients, groupId, senderId } = req.body;
      const tpl: any = await this.smsService.getTemplateById(id);
      if (!tpl) return res.status(StatusCodes.NOT_FOUND).json({ error: true, message: 'Template not found' });
      let targets: string[] = [];
      if (Array.isArray(recipients)) targets = recipients;
      if (groupId) {
        const group: any = await this.smsService.getRecipientGroupById(groupId);
        if (group && Array.isArray(group.contacts)) {
          targets = targets.concat(group.contacts.map((c: any) => c.phone));
        }
      }
      targets = Array.from(new Set(targets)).filter(Boolean);
      if (targets.length === 0) return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: 'No recipients provided' });
      const from = undefined; // use configured Twilio from or sender mapping
      const result = await this.smsService.sendBulkSms(targets, tpl.message, from);
      res.status(StatusCodes.OK).json({ error: false, data: result });
    } catch (err) { next(err); }
  }
}
