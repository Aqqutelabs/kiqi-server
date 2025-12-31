"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormService = void 0;
const CampaignContact_1 = require("../../models/CampaignContact");
const Form_1 = require("../../models/Form");
const mongoose_1 = require("mongoose");
const FormSubmissions_1 = require("../../models/FormSubmissions");
class FormService {
    // Public: Handle a form submission from the hosted link
    submitForm(formId, submissionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🔵 [FormService.submitForm] Starting submission for formId:", formId);
                console.log("🔵 [FormService.submitForm] FormModel type:", typeof Form_1.FormModel);
                console.log("🔵 [FormService.submitForm] CampaignContactModel type:", typeof CampaignContact_1.CampaignContactModel);
                const form = yield Form_1.FormModel.findById(formId);
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
                if (!email)
                    throw new Error("Email field is required for contact creation");
                // 2. Upsert Contact
                console.log("🔵 [FormService.submitForm] Upserting contact with email:", email);
                const contact = yield CampaignContact_1.CampaignContactModel.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(form.userId), "emails.address": email.toLowerCase() }, {
                    $set: {
                        firstName: firstNameKey ? submissionData[firstNameKey] : "New",
                        lastName: lastNameKey ? submissionData[lastNameKey] : "Lead"
                    },
                    $addToSet: Object.assign({ emails: { address: email.toLowerCase(), isPrimary: true }, tags: ["Lead Form", form.name] }, (phoneKey ? { phones: { number: submissionData[phoneKey], isPrimary: true } } : {}))
                }, { upsert: true, new: true });
                console.log("✅ [FormService.submitForm] Contact created/updated:", contact._id);
                // 3. Save Submission
                console.log("🔵 [FormService.submitForm] Creating form submission record");
                const submission = yield FormSubmissions_1.FormSubmissionModel.create({
                    formId: form._id,
                    userId: form.userId,
                    contactId: contact._id,
                    data: submissionData
                });
                console.log("✅ [FormService.submitForm] Submission saved:", submission._id);
                // 4. Increment submission count on form
                console.log("🔵 [FormService.submitForm] Incrementing submission count");
                yield Form_1.FormModel.updateOne({ _id: formId }, { $inc: { submissionCount: 1 } });
                console.log("✅ [FormService.submitForm] Submission count incremented");
                return submission;
            }
            catch (error) {
                console.error("❌ [FormService.submitForm] Error:", error instanceof Error ? error.message : error);
                throw error;
            }
        });
    }
    // Private: Get all submissions for the user's dashboard
    getSubmissions(userId, formId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield FormSubmissions_1.FormSubmissionModel.find({ formId, userId })
                .populate("contactId", "firstName lastName emails phones")
                .sort({ createdAt: -1 });
        });
    }
}
exports.FormService = FormService;
