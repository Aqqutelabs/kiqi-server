import { CampaignContactModel } from "../../models/CampaignContact";
import { FormModel } from "../../models/Form";

import { Types } from "mongoose";
import { FormSubmissionModel } from "../../models/FormSubmissions";

export class FormService {
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
      const emailKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("email"));
      const firstNameKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("first name"));
      const lastNameKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("last name"));
      const phoneKey = Object.keys(submissionData).find(k => k.toLowerCase().includes("phone"));

      const email = emailKey ? submissionData[emailKey] : null;
      console.log("🔵 [FormService.submitForm] Extracted fields - email:", email, "firstName:", firstNameKey, "lastName:", lastNameKey);

      if (!email) throw new Error("Email field is required for contact creation");

      // 2. Upsert Contact
      console.log("🔵 [FormService.submitForm] Upserting contact with email:", email);
      const contact = await CampaignContactModel.findOneAndUpdate(
        { userId: new Types.ObjectId(form.userId as any), "emails.address": email.toLowerCase() },
        {
          $set: {
            firstName: firstNameKey ? submissionData[firstNameKey] : "New",
            lastName: lastNameKey ? submissionData[lastNameKey] : "Lead"
          },
          $addToSet: { 
            emails: { address: email.toLowerCase(), isPrimary: true },
            tags: ["Lead Form", form.name],
            ...(phoneKey ? { phones: { number: submissionData[phoneKey], isPrimary: true } } : {})
          }
        },
        { upsert: true, new: true }
      );
      console.log("✅ [FormService.submitForm] Contact created/updated:", contact._id);

      // 3. Save Submission
      console.log("🔵 [FormService.submitForm] Creating form submission record");
      const submission = await FormSubmissionModel.create({
        formId: form._id,
        userId: form.userId,
        contactId: contact._id,
        data: submissionData
      });
      console.log("✅ [FormService.submitForm] Submission saved:", submission._id);

      // 4. Increment submission count on form
      console.log("🔵 [FormService.submitForm] Incrementing submission count");
      await FormModel.updateOne({ _id: formId }, { $inc: { submissionCount: 1 } });
      console.log("✅ [FormService.submitForm] Submission count incremented");

      return submission;
    } catch (error) {
      console.error("❌ [FormService.submitForm] Error:", error instanceof Error ? error.message : error);
      throw error;
    }
  }

  // Private: Get all submissions for the user's dashboard
  public async getSubmissions(userId: string, formId: string) {
    return await FormSubmissionModel.find({ formId, userId })
      .populate("contactId", "firstName lastName emails phones")
      .sort({ createdAt: -1 });
  }
}