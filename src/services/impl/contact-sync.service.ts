import { Types } from "mongoose";
import { CampaignContactModel, ICampaignContact } from "../../models/CampaignContact";
import { EmailListModel } from "../../models/EmailList";
import { RecipientGroupModel } from "../../models/RecipientGroup";
import { ListModel } from "../../models/CampaignList";

const GENERAL_EMAIL_LIST_NAME = "General";
const GENERAL_SMS_GROUP_NAME = "General";

/**
 * ContactSyncService handles automatic synchronization between:
 * - CampaignContacts → Email Lists (for contacts with emails)
 * - CampaignContacts → SMS Recipient Groups (for contacts with phones)
 * - CRM Lists → Email Lists (when contacts are added to lists)
 */
export class ContactSyncService {
  
  /**
   * Find or create the "General" email list for a user
   */
  public async findOrCreateGeneralEmailList(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    let generalList = await EmailListModel.findOne({
      email_listName: GENERAL_EMAIL_LIST_NAME,
      userId: userObjectId
    });
    
    if (!generalList) {
      generalList = await EmailListModel.create({
        email_listName: GENERAL_EMAIL_LIST_NAME,
        emails: [],
        userId: userObjectId
      });
    }
    
    return generalList;
  }

  /**
   * Find or create the "General" SMS recipient group for a user
   */
  public async findOrCreateGeneralSmsGroup(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    let generalGroup = await RecipientGroupModel.findOne({
      name: GENERAL_SMS_GROUP_NAME,
      userId: userObjectId
    });
    
    if (!generalGroup) {
      generalGroup = await RecipientGroupModel.create({
        name: GENERAL_SMS_GROUP_NAME,
        contacts: [],
        userId: userObjectId
      });
    }
    
    return generalGroup;
  }

  /**
   * Add a contact's email to the General email list
   * Called when a new contact is created with an email
   */
  public async addContactToGeneralEmailList(userId: string, contact: ICampaignContact) {
    // Get primary email or first email
    const primaryEmail = contact.emails?.find(e => e.isPrimary) || contact.emails?.[0];
    if (!primaryEmail?.address) return null;

    const generalList = await this.findOrCreateGeneralEmailList(userId);
    
    // Check if email already exists to avoid duplicates
    const emailExists = generalList.emails?.some(
      e => e.email.toLowerCase() === primaryEmail.address.toLowerCase()
    );
    
    if (!emailExists) {
      await EmailListModel.findByIdAndUpdate(
        generalList._id,
        {
          $addToSet: {
            emails: {
              email: primaryEmail.address,
              fullName: `${contact.firstName} ${contact.lastName}`.trim()
            }
          }
        }
      );
    }
    
    return generalList;
  }

  /**
   * Add a contact's phone to the General SMS recipient group
   * Called when a new contact is created with a phone number
   */
  public async addContactToGeneralSmsGroup(userId: string, contact: ICampaignContact) {
    // Get primary phone or first phone
    const primaryPhone = contact.phones?.find(p => p.isPrimary) || contact.phones?.[0];
    if (!primaryPhone?.number) return null;

    const generalGroup = await this.findOrCreateGeneralSmsGroup(userId);
    
    // Check if phone already exists to avoid duplicates
    const phoneExists = (generalGroup as any).contacts?.some(
      (c: any) => c.phone === primaryPhone.number
    );
    
    if (!phoneExists) {
      await RecipientGroupModel.findByIdAndUpdate(
        generalGroup._id,
        {
          $addToSet: {
            contacts: { phone: primaryPhone.number }
          }
        }
      );
    }
    
    return generalGroup;
  }

  /**
   * Sync a newly created contact to appropriate general lists
   * Called after creating a campaign contact
   */
  public async syncNewContactToGeneralLists(userId: string, contact: ICampaignContact) {
    const results = {
      addedToEmailList: false,
      addedToSmsGroup: false
    };

    // If contact has emails, add to General Email List
    if (contact.emails && contact.emails.length > 0) {
      await this.addContactToGeneralEmailList(userId, contact);
      results.addedToEmailList = true;
    }

    // If contact has phones, add to General SMS Group
    if (contact.phones && contact.phones.length > 0) {
      await this.addContactToGeneralSmsGroup(userId, contact);
      results.addedToSmsGroup = true;
    }

    return results;
  }

  /**
   * Find or create an email list with a specific name for a user
   */
  public async findOrCreateEmailList(userId: string, listName: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    let emailList = await EmailListModel.findOne({
      email_listName: listName,
      userId: userObjectId
    });
    
    if (!emailList) {
      emailList = await EmailListModel.create({
        email_listName: listName,
        emails: [],
        userId: userObjectId
      });
    }
    
    return emailList;
  }

  /**
   * Sync contacts from a CRM list to a corresponding Email List
   * Called when contacts are added to a CRM list
   */
  public async syncCrmListToEmailList(userId: string, crmListId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    // Get the CRM list with populated contacts
    const crmList = await ListModel.findOne({
      _id: new Types.ObjectId(crmListId),
      userId: userObjectId
    }).populate('contacts');
    
    if (!crmList) {
      throw new Error("CRM List not found");
    }

    // Get contacts with emails
    const contactsWithEmails = (crmList.contacts as any[]).filter(
      contact => contact.emails && contact.emails.length > 0
    );

    if (contactsWithEmails.length === 0) {
      return { synced: 0, emailListId: null };
    }

    // Find or create email list with the same name
    const emailList = await this.findOrCreateEmailList(userId, crmList.name);

    // Prepare emails to add
    const emailsToAdd = contactsWithEmails.map(contact => {
      const primaryEmail = contact.emails.find((e: any) => e.isPrimary) || contact.emails[0];
      return {
        email: primaryEmail.address,
        fullName: `${contact.firstName} ${contact.lastName}`.trim()
      };
    });

    // Add emails to the list (using $addToSet to avoid duplicates)
    for (const emailData of emailsToAdd) {
      const emailExists = emailList.emails?.some(
        e => e.email.toLowerCase() === emailData.email.toLowerCase()
      );
      
      if (!emailExists) {
        await EmailListModel.findByIdAndUpdate(
          emailList._id,
          { $addToSet: { emails: emailData } }
        );
      }
    }

    return { 
      synced: emailsToAdd.length, 
      emailListId: emailList._id,
      emailListName: crmList.name
    };
  }

  /**
   * Sync contacts from a CRM list to a corresponding SMS Recipient Group
   * Called when contacts are added to a CRM list
   */
  public async syncCrmListToSmsGroup(userId: string, crmListId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    // Get the CRM list with populated contacts
    const crmList = await ListModel.findOne({
      _id: new Types.ObjectId(crmListId),
      userId: userObjectId
    }).populate('contacts');
    
    if (!crmList) {
      throw new Error("CRM List not found");
    }

    // Get contacts with phones
    const contactsWithPhones = (crmList.contacts as any[]).filter(
      contact => contact.phones && contact.phones.length > 0
    );

    if (contactsWithPhones.length === 0) {
      return { synced: 0, smsGroupId: null };
    }

    // Find or create SMS group with the same name
    let smsGroup = await RecipientGroupModel.findOne({
      name: crmList.name,
      userId: userObjectId
    });

    if (!smsGroup) {
      smsGroup = await RecipientGroupModel.create({
        name: crmList.name,
        contacts: [],
        userId: userObjectId
      });
    }

    // Add phones to the group
    for (const contact of contactsWithPhones) {
      const primaryPhone = contact.phones.find((p: any) => p.isPrimary) || contact.phones[0];
      const phoneExists = (smsGroup as any).contacts?.some(
        (c: any) => c.phone === primaryPhone.number
      );
      
      if (!phoneExists) {
        await RecipientGroupModel.findByIdAndUpdate(
          smsGroup._id,
          { $addToSet: { contacts: { phone: primaryPhone.number } } }
        );
      }
    }

    return { 
      synced: contactsWithPhones.length, 
      smsGroupId: smsGroup._id,
      smsGroupName: crmList.name
    };
  }

  /**
   * Remove a contact's email from an email list
   */
  public async removeContactFromEmailList(userId: string, emailListId: string, email: string) {
    await EmailListModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(emailListId), 
        userId: new Types.ObjectId(userId) 
      },
      { $pull: { emails: { email: email.toLowerCase() } } }
    );
  }

  /**
   * Remove a contact's phone from an SMS group
   */
  public async removeContactFromSmsGroup(userId: string, smsGroupId: string, phone: string) {
    await RecipientGroupModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(smsGroupId), 
        userId: new Types.ObjectId(userId) 
      },
      { $pull: { contacts: { phone } } }
    );
  }

  /**
   * Bulk sync multiple contacts to general lists
   * Used for CSV imports
   */
  public async bulkSyncContactsToGeneralLists(userId: string, contacts: ICampaignContact[]) {
    const results = {
      emailsAdded: 0,
      phonesAdded: 0
    };

    // Collect all emails and phones first
    const emailsToAdd: { email: string; fullName: string }[] = [];
    const phonesToAdd: { phone: string }[] = [];

    for (const contact of contacts) {
      if (contact.emails && contact.emails.length > 0) {
        const primaryEmail = contact.emails.find(e => e.isPrimary) || contact.emails[0];
        if (primaryEmail?.address) {
          emailsToAdd.push({
            email: primaryEmail.address,
            fullName: `${contact.firstName} ${contact.lastName}`.trim()
          });
        }
      }

      if (contact.phones && contact.phones.length > 0) {
        const primaryPhone = contact.phones.find(p => p.isPrimary) || contact.phones[0];
        if (primaryPhone?.number) {
          phonesToAdd.push({ phone: primaryPhone.number });
        }
      }
    }

    // Bulk add to General Email List
    if (emailsToAdd.length > 0) {
      const generalEmailList = await this.findOrCreateGeneralEmailList(userId);
      
      // Filter out duplicates
      const existingEmails = new Set(
        generalEmailList.emails?.map(e => e.email.toLowerCase()) || []
      );
      
      const newEmails = emailsToAdd.filter(
        e => !existingEmails.has(e.email.toLowerCase())
      );
      
      if (newEmails.length > 0) {
        await EmailListModel.findByIdAndUpdate(
          generalEmailList._id,
          { $addToSet: { emails: { $each: newEmails } } }
        );
        results.emailsAdded = newEmails.length;
      }
    }

    // Bulk add to General SMS Group
    if (phonesToAdd.length > 0) {
      const generalSmsGroup = await this.findOrCreateGeneralSmsGroup(userId);
      
      // Filter out duplicates
      const existingPhones = new Set(
        (generalSmsGroup as any).contacts?.map((c: any) => c.phone) || []
      );
      
      const newPhones = phonesToAdd.filter(
        p => !existingPhones.has(p.phone)
      );
      
      if (newPhones.length > 0) {
        await RecipientGroupModel.findByIdAndUpdate(
          generalSmsGroup._id,
          { $addToSet: { contacts: { $each: newPhones } } }
        );
        results.phonesAdded = newPhones.length;
      }
    }

    return results;
  }
}
