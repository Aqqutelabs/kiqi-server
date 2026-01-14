import { CampaignContactModel } from "../../models/CampaignContact";
import { FormModel } from "../../models/Form";

import { Types } from "mongoose";
import { FormSubmissionModel } from "../../models/FormSubmissions";
import { ListService } from "./list.service.impl";
import { RecipientGroupModel } from "../../models/RecipientGroup";

export class FormService {
  private listService: ListService;

  constructor() {
    this.listService = new ListService();
  }

  // Public: Get all submissions for a form and user
  public async getSubmissions(userId: string, formId: string) {
    return await FormSubmissionModel.find({ formId, userId })
      .populate("contactId", "firstName lastName emails phones")
      .sort({ createdAt: -1 });
  }

  /**
   * Find or create a CRM list for a form
   * List name format: "[Form] {formName}"
   */
  private async findOrCreateFormList(userId: string, formName: string) {
    const listName = `[Form] ${formName}`;
    const userObjectId = new Types.ObjectId(userId);
    
    const { ListModel } = await import("../../models/CampaignList");
    
    // Check if list already exists
    let list = await ListModel.findOne({
      userId: userObjectId,
      name: listName
    });
    
    // Create if doesn't exist
    if (!list) {
      list = await this.listService.createList(
        userId, 
        listName, 
        `Automatically created for form: ${formName}`
      );
      console.log("✅ [FormService] Created new list for form:", listName);
    }
    
    return list;
  }

  /**
   * Find or create an SMS recipient group for a form
   * Group name format: "[Form] {formName}"
   */
  private async findOrCreateFormRecipientGroup(userId: string, formName: string) {
    const groupName = `[Form] ${formName}`;
    const userObjectId = new Types.ObjectId(userId);
    
    // Check if recipient group already exists
    let group = await RecipientGroupModel.findOne({
      userId: userObjectId,
      name: groupName
    });
    
    // Create if doesn't exist
    if (!group) {
      group = await RecipientGroupModel.create({
        name: groupName,
        contacts: [],
        userId: userObjectId
      });
      console.log("✅ [FormService] Created new recipient group for form:", groupName);
    }
    
    return group;
  }

  /**
   * Add a phone number to a recipient group (if not already present)
   */
  private async addPhoneToRecipientGroup(groupId: string, phoneNumber: string) {
    // Check if phone already exists in the group
    const group = await RecipientGroupModel.findById(groupId);
    if (!group) {
      throw new Error("Recipient group not found");
    }

    const phoneExists = group.contacts.some(
      (contact) => contact.phone === phoneNumber
    );

    if (!phoneExists) {
      await RecipientGroupModel.findByIdAndUpdate(
        groupId,
        {
          $push: {
            contacts: { phone: phoneNumber }
          }
        },
        { new: true }
      );
      console.log("✅ [FormService] Phone added to recipient group:", phoneNumber);
      return true;
    } else {
      console.log("ℹ️ [FormService] Phone already exists in recipient group:", phoneNumber);
      return false;
    }
  }

  // Public: Handle a form submission from the hosted link
  public async submitForm(formId: string, submissionData: Record<string, any>) {
    try {
      console.log("🔵 [FormService.submitForm] Starting submission for formId:", formId);
      console.log("🔵 [FormService.submitForm] FormModel type:", typeof FormModel);
      console.log("🔵 [FormService.submitForm] CampaignContactModel type:", typeof CampaignContactModel);
      
      const form = await FormModel.findById(formId);
      console.log("🔵 [FormService.submitForm] Form found:", form ? form._id : "NOT FOUND");
      
      if (!form || !form.isActive) {
        throw new Error("Form not found or inactive");
      }

      // 1. Extract standard fields (case-insensitive search for Email/Phone/Name)
      // Note: submissionData keys are normalized (no spaces, lowercase) e.g., "firstname", "emailaddress"
      const emailKey = Object.keys(submissionData).find(k => {
        const normalized = k.toLowerCase().replace(/\s+/g, '');
        return normalized.includes("email");
      });
      const firstNameKey = Object.keys(submissionData).find(k => {
        const normalized = k.toLowerCase().replace(/\s+/g, '');
        return normalized.includes("firstname") || normalized === "firstname";
      });
      const lastNameKey = Object.keys(submissionData).find(k => {
        const normalized = k.toLowerCase().replace(/\s+/g, '');
        return normalized.includes("lastname") || normalized === "lastname";
      });
      const phoneKey = Object.keys(submissionData).find(k => {
        const normalized = k.toLowerCase().replace(/\s+/g, '');
        return normalized.includes("phone") || normalized.includes("mobile") || 
               normalized.includes("phonenumber") || normalized.includes("cellphone") ||
               normalized.includes("cell") || normalized.includes("tel");
      });

      const email = emailKey ? submissionData[emailKey] : null;
      const firstName = firstNameKey ? submissionData[firstNameKey] : null;
      const lastName = lastNameKey ? submissionData[lastNameKey] : null;
      
      console.log("🔵 [FormService.submitForm] Extracted keys - emailKey:", emailKey, "firstNameKey:", firstNameKey, "lastNameKey:", lastNameKey, "phoneKey:", phoneKey);
      console.log("🔵 [FormService.submitForm] Extracted values - email:", email, "firstName:", firstName, "lastName:", lastName);
      console.log("🔵 [FormService.submitForm] Phone value:", phoneKey ? submissionData[phoneKey] : "NO_PHONE_FOUND");

      if (!email) throw new Error("Email field is required for contact creation");

      // 2. Upsert Contact - First try to find existing contact
      console.log("🔵 [FormService.submitForm] Upserting contact with email:", email);
      
      let contact = await CampaignContactModel.findOne({
        userId: new Types.ObjectId(form.userId as any),
        "emails.address": email.toLowerCase()
      });

      if (contact) {
        // Update existing contact
        console.log("🔵 [FormService.submitForm] Updating existing contact:", contact._id);
        const updateFirstName = firstName || contact.firstName;
        const updateLastName = lastName || contact.lastName;
        console.log("🔵 [FormService.submitForm] Updating with firstName:", updateFirstName, "lastName:", updateLastName);
        
        contact = await CampaignContactModel.findByIdAndUpdate(
          contact._id,
          {
            $set: {
              firstName: updateFirstName,
              lastName: updateLastName
            },
            $addToSet: {
              tags: { $each: ["Lead Form", form.name] },
              ...(phoneKey ? { phones: { number: submissionData[phoneKey], isPrimary: false } } : {})
            }
          },
          { new: true }
        );
      } else {
        // Create new contact
        console.log("🔵 [FormService.submitForm] Creating new contact");
        const newFirstName = firstName || "New";
        const newLastName = lastName || "Lead";
        console.log("🔵 [FormService.submitForm] Creating with firstName:", newFirstName, "lastName:", newLastName);
        
        contact = await CampaignContactModel.create({
          userId: new Types.ObjectId(form.userId as any),
          firstName: newFirstName,
          lastName: newLastName,
          emails: [{ address: email.toLowerCase(), isPrimary: true }],
          phones: phoneKey ? [{ number: submissionData[phoneKey], isPrimary: true }] : [],
          tags: ["Lead Form", form.name]
        });
      }
      
      if (!contact) {
        throw new Error("Failed to create or update contact");
      }
      
      const contactId = (contact._id as any).toString();
      console.log("✅ [FormService.submitForm] Contact created/updated:", contactId);

      // 3. Add contact to form-specific CRM list
      console.log("🔵 [FormService.submitForm] Adding contact to form list");
      try {
        const formList = await this.findOrCreateFormList(form.userId.toString(), form.name);
        const listId = (formList._id as any).toString();
        
        await this.listService.addContactsToList(
          form.userId.toString(), 
          listId, 
          [contactId]
        );
        console.log("✅ [FormService.submitForm] Contact added to list:", formList.name);
      } catch (listError) {
        // Don't fail submission if list operation fails, just log it
        console.warn("⚠️ [FormService.submitForm] Failed to add contact to list:", listError);
      }

      // 4. Add phone to form-specific SMS recipient group (if phone was provided)
      const phoneNumber = phoneKey ? submissionData[phoneKey] : null;
      if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
        console.log("🔵 [FormService.submitForm] Adding phone to recipient group:", phoneNumber);
        try {
          const recipientGroup = await this.findOrCreateFormRecipientGroup(form.userId.toString(), form.name);
          const groupId = (recipientGroup._id as any).toString();
          
          await this.addPhoneToRecipientGroup(groupId, phoneNumber.trim());
          console.log("✅ [FormService.submitForm] Phone added to recipient group:", recipientGroup.name);
        } catch (groupError) {
          // Don't fail submission if recipient group operation fails, just log it
          console.warn("⚠️ [FormService.submitForm] Failed to add phone to recipient group:", groupError);
        }
      } else {
        console.log("ℹ️ [FormService.submitForm] No valid phone number provided, skipping recipient group");
      }

      // 5. Save Submission
      console.log("🔵 [FormService.submitForm] Creating form submission record");
      const submission = await FormSubmissionModel.create({
        formId: form._id,
        userId: form.userId,
        contactId: contactId,
        data: submissionData
      });
      console.log("✅ [FormService.submitForm] Submission saved:", submission._id);

      // 6. Increment submission count on form
      console.log("🔵 [FormService.submitForm] Incrementing submission count");
      await FormModel.updateOne({ _id: formId }, { $inc: { submissionCount: 1 } });
      console.log("✅ [FormService.submitForm] Submission count incremented");

      return submission;
    } catch (error) {
      console.error("❌ [FormService.submitForm] Error:", error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // Delete a form and its submissions
  public async deleteForm(userId: string, formId: string) {
    try {
      console.log("🔵 [FormService.deleteForm] Deleting form:", formId, "for userId:", userId);
      
      // Verify form belongs to user before deleting
      const form = await FormModel.findOne({ _id: formId, userId });
      if (!form) {
        throw new Error("Form not found or you don't have permission to delete it");
      }

      // Delete all submissions associated with this form
      console.log("🔵 [FormService.deleteForm] Deleting submissions for formId:", formId);
      await FormSubmissionModel.deleteMany({ formId });

      // Delete the form
      console.log("🔵 [FormService.deleteForm] Deleting form document");
      const result = await FormModel.deleteOne({ _id: formId, userId });
      console.log("✅ [FormService.deleteForm] Form deleted successfully");

      return result;
    } catch (error) {
      console.error("❌ [FormService.deleteForm] Error:", error instanceof Error ? error.message : error);
      throw error;
    }
  }
}