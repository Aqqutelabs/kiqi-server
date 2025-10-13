export interface SmsService {
  createSender(name: string, sampleMessage: string | undefined, userId: any): Promise<any>;
  getSendersByUser(userId: any): Promise<any[]>;
  deleteSender(id: string): Promise<void>;

  createRecipientGroup(name: string, contacts: string[], userId: any): Promise<any>;
  getRecipientGroups(userId: any): Promise<any[]>;
  getRecipientGroupById(id: string): Promise<any>;
  deleteRecipientGroup(id: string): Promise<void>;

  createTemplate(title: string, message: string, userId: any): Promise<any>;
  getTemplates(userId: any): Promise<any[]>;
  deleteTemplate(id: string): Promise<void>;

  createDraft(data: any): Promise<any>;
  getDrafts(userId: any): Promise<any[]>;
  deleteDraft(id: string): Promise<void>;

  sendBulkSms(recipients: string[], message: string, from?: string): Promise<any>;
}
