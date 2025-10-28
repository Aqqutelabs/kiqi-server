export interface SmsService {
  createSender(name: string, sampleMessage: string | undefined, userId: any): Promise<any>;
  getSendersByUser(userId: any): Promise<any[]>;
  updateSender(id: string, data: { name?: string; sampleMessage?: string }): Promise<any>;
  deleteSender(id: string): Promise<void>;
  sendMessage(to: string, body: string, from?: string): Promise<any>;

  createRecipientGroup(name: string, contacts: string[], userId: any): Promise<any>;
  getRecipientGroups(userId: any): Promise<any[]>;
  getRecipientGroupById(id: string): Promise<any>;
  updateRecipientGroup(id: string, data: { name?: string; contacts?: string[] }): Promise<any>;
  deleteRecipientGroup(id: string): Promise<void>;

  createTemplate(title: string, message: string, userId: any): Promise<any>;
  getTemplates(userId: any): Promise<any[]>;
  getTemplateById(id: string): Promise<any>;
  updateTemplate(id: string, data: { title?: string; message?: string }): Promise<any>;
  deleteTemplate(id: string): Promise<void>;

  createDraft(data: any): Promise<any>;
  getDrafts(userId: any): Promise<any[]>;
  getDraftById(id: string): Promise<any>;
  updateDraft(id: string, data: any): Promise<any>;
  deleteDraft(id: string): Promise<void>;
  sendDraft(id: string): Promise<any>;

  sendBulkSms(recipients: string[], message: string, from?: string): Promise<any>;
}
