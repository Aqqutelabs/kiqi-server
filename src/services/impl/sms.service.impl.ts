import { SmsService } from "../sms.service";
import { SmsSenderModel } from "../../models/SmsSender";
import { RecipientGroupModel } from "../../models/RecipientGroup";
import { SmsTemplateModel } from "../../models/SmsTemplate";
import { SmsDraftModel } from "../../models/SmsDraft";
import { sendSms } from "../../utils/TwilioService";
import { ApiError } from "../../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

export class SmsServiceImpl implements SmsService {
  async createSender(name: string, sampleMessage: string | undefined, userId: any) {
    const sender = await SmsSenderModel.create({ name, sampleMessage, userId });
    return sender;
  }

  async getSendersByUser(userId: any) {
    return SmsSenderModel.find({ userId });
  }

  async deleteSender(id: string) {
    await SmsSenderModel.findByIdAndDelete(id);
  }

  async createRecipientGroup(name: string, contacts: string[], userId: any) {
    const group = await RecipientGroupModel.create({ name, contacts: contacts.map((p) => ({ phone: p })), userId });
    return group;
  }

  async getRecipientGroups(userId: any) {
    return RecipientGroupModel.find({ userId });
  }

  async getRecipientGroupById(id: string) {
    return RecipientGroupModel.findById(id);
  }

  async deleteRecipientGroup(id: string) {
    await RecipientGroupModel.findByIdAndDelete(id);
  }

  async createTemplate(title: string, message: string, userId: any) {
    const tpl = await SmsTemplateModel.create({ title, message, userId });
    return tpl;
  }

  async getTemplates(userId: any) {
    return SmsTemplateModel.find({ userId });
  }

  async deleteTemplate(id: string) {
    await SmsTemplateModel.findByIdAndDelete(id);
  }

  async createDraft(data: any) {
    const draft = await SmsDraftModel.create(data);
    return draft;
  }

  async getDrafts(userId: any) {
    return SmsDraftModel.find({ userId });
  }

  async deleteDraft(id: string) {
    await SmsDraftModel.findByIdAndDelete(id);
  }

  async sendBulkSms(recipients: string[], message: string, from?: string) {
    const results: any[] = [];
    for (const to of recipients) {
      // basic phone validation
      const normalized = (to || '').toString().replace(/\s+/g, '');
      if (!normalized.match(/^\+?\d{7,15}$/)) {
        // skip invalid numbers
        results.push({ to, status: 'invalid' });
        continue;
      }
      const res = await sendSms(normalized, message, from);
      results.push({ to, sid: res.sid, status: 'sent' });
    }
    return results;
  }
}
