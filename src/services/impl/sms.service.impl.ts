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

  async updateSender(id: string, data: { name?: string; sampleMessage?: string }) {
    const updated = await SmsSenderModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Sender not found');
    return updated;
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

  async updateRecipientGroup(id: string, data: { name?: string; contacts?: string[] }) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (Array.isArray(data.contacts)) updateData.contacts = data.contacts.map((p) => ({ phone: p }));
    const updated = await RecipientGroupModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Recipient group not found');
    return updated;
  }

  async sendMessage(to: string, body: string, from?: string) {
    const result = await sendSms(to, body, from);
    return result;
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

  async getTemplateById(id: string) {
    return SmsTemplateModel.findById(id);
  }

  async updateTemplate(id: string, data: { title?: string; message?: string }) {
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.message) updateData.message = data.message;
    const updated = await SmsTemplateModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Template not found');
    return updated;
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

  async getDraftById(id: string) {
    return SmsDraftModel.findById(id);
  }

  async updateDraft(id: string, data: any) {
    const updated = await SmsDraftModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'Draft not found');
    return updated;
  }

  async sendDraft(id: string) {
    const draft = await SmsDraftModel.findById(id);
    if (!draft) throw new ApiError(StatusCodes.NOT_FOUND, 'Draft not found');
    // Use recipients from group or direct
    let recipients: string[] = draft.recipients || [];
    if ((!recipients || recipients.length === 0) && draft.recipientsGroupId) {
      const group: any = await RecipientGroupModel.findById(draft.recipientsGroupId);
      if (group && Array.isArray(group.contacts)) {
        recipients = group.contacts.map((c: any) => c.phone);
      }
    }
    recipients = Array.from(new Set(recipients)).filter(Boolean);
    if (recipients.length === 0) throw new ApiError(StatusCodes.BAD_REQUEST, 'No recipients for draft');
    const results = await this.sendBulkSms(recipients, draft.message);
    draft.status = 'sent';
    await draft.save();
    return { draft, results };
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
