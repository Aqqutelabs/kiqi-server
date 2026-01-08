"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const list_service_impl_1 = require("./list.service.impl");
class FormService {
    constructor() {
        this.listService = new list_service_impl_1.ListService();
    }
    /**
     * Find or create a CRM list for a form
     * List name format: "[Form] {formName}"
     */
    findOrCreateFormList(userId, formName) {
        return __awaiter(this, void 0, void 0, function* () {
            const listName = `[Form] ${formName}`;
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            const { ListModel } = yield Promise.resolve().then(() => __importStar(require("../../models/CampaignList")));
            // Check if list already exists
            let list = yield ListModel.findOne({
                userId: userObjectId,
                name: listName
            });
            // Create if doesn't exist
            if (!list) {
                list = yield this.listService.createList(userId, listName, `Automatically created for form: ${formName}`);
                console.log("✅ [FormService] Created new list for form:", listName);
            }
            return list;
        });
    }
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
                    return normalized.includes("phone") || normalized.includes("mobile");
                });
                const email = emailKey ? submissionData[emailKey] : null;
                const firstName = firstNameKey ? submissionData[firstNameKey] : null;
                const lastName = lastNameKey ? submissionData[lastNameKey] : null;
                console.log("🔵 [FormService.submitForm] Extracted keys - emailKey:", emailKey, "firstNameKey:", firstNameKey, "lastNameKey:", lastNameKey);
                console.log("🔵 [FormService.submitForm] Extracted values - email:", email, "firstName:", firstName, "lastName:", lastName);
                if (!email)
                    throw new Error("Email field is required for contact creation");
                // 2. Upsert Contact - First try to find existing contact
                console.log("🔵 [FormService.submitForm] Upserting contact with email:", email);
                let contact = yield CampaignContact_1.CampaignContactModel.findOne({
                    userId: new mongoose_1.Types.ObjectId(form.userId),
                    "emails.address": email.toLowerCase()
                });
                if (contact) {
                    // Update existing contact
                    console.log("🔵 [FormService.submitForm] Updating existing contact:", contact._id);
                    const updateFirstName = firstName || contact.firstName;
                    const updateLastName = lastName || contact.lastName;
                    console.log("🔵 [FormService.submitForm] Updating with firstName:", updateFirstName, "lastName:", updateLastName);
                    contact = yield CampaignContact_1.CampaignContactModel.findByIdAndUpdate(contact._id, {
                        $set: {
                            firstName: updateFirstName,
                            lastName: updateLastName
                        },
                        $addToSet: Object.assign({ tags: { $each: ["Lead Form", form.name] } }, (phoneKey ? { phones: { number: submissionData[phoneKey], isPrimary: false } } : {}))
                    }, { new: true });
                }
                else {
                    // Create new contact
                    console.log("🔵 [FormService.submitForm] Creating new contact");
                    const newFirstName = firstName || "New";
                    const newLastName = lastName || "Lead";
                    console.log("🔵 [FormService.submitForm] Creating with firstName:", newFirstName, "lastName:", newLastName);
                    contact = yield CampaignContact_1.CampaignContactModel.create({
                        userId: new mongoose_1.Types.ObjectId(form.userId),
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
                const contactId = contact._id.toString();
                console.log("✅ [FormService.submitForm] Contact created/updated:", contactId);
                // 3. Add contact to form-specific CRM list
                console.log("🔵 [FormService.submitForm] Adding contact to form list");
                try {
                    const formList = yield this.findOrCreateFormList(form.userId.toString(), form.name);
                    const listId = formList._id.toString();
                    yield this.listService.addContactsToList(form.userId.toString(), listId, [contactId]);
                    console.log("✅ [FormService.submitForm] Contact added to list:", formList.name);
                }
                catch (listError) {
                    // Don't fail submission if list operation fails, just log it
                    console.warn("⚠️ [FormService.submitForm] Failed to add contact to list:", listError);
                }
                // 4. Save Submission
                console.log("🔵 [FormService.submitForm] Creating form submission record");
                const submission = yield FormSubmissions_1.FormSubmissionModel.create({
                    formId: form._id,
                    userId: form.userId,
                    contactId: contactId,
                    data: submissionData
                });
                console.log("✅ [FormService.submitForm] Submission saved:", submission._id);
                // 5. Increment submission count on form
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
    // Delete a form and its submissions
    deleteForm(userId, formId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🔵 [FormService.deleteForm] Deleting form:", formId, "for userId:", userId);
                // Verify form belongs to user before deleting
                const form = yield Form_1.FormModel.findOne({ _id: formId, userId });
                if (!form) {
                    throw new Error("Form not found or you don't have permission to delete it");
                }
                // Delete all submissions associated with this form
                console.log("🔵 [FormService.deleteForm] Deleting submissions for formId:", formId);
                yield FormSubmissions_1.FormSubmissionModel.deleteMany({ formId });
                // Delete the form
                console.log("🔵 [FormService.deleteForm] Deleting form document");
                const result = yield Form_1.FormModel.deleteOne({ _id: formId, userId });
                console.log("✅ [FormService.deleteForm] Form deleted successfully");
                return result;
            }
            catch (error) {
                console.error("❌ [FormService.deleteForm] Error:", error instanceof Error ? error.message : error);
                throw error;
            }
        });
    }
}
exports.FormService = FormService;
