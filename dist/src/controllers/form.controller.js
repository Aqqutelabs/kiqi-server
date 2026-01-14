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
exports.FormController = void 0;
const form_service_impl_1 = require("../services/impl/form.service.impl");
const Form_1 = require("../models/Form");
const http_status_codes_1 = require("http-status-codes");
const slug_1 = require("../utils/slug");
const formService = new form_service_impl_1.FormService();
class FormController {
    constructor() {
        // CREATE FORM (Builder)
        this.createForm = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log("🔵 [FormController.createForm] Starting form creation");
                console.log("🔵 [FormController.createForm] FormModel type:", typeof Form_1.FormModel);
                console.log("🔵 [FormController.createForm] FormModel keys:", Object.keys(Form_1.FormModel || {}));
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                console.log("🔵 [FormController.createForm] userId:", userId);
                console.log("🔵 [FormController.createForm] Request body:", req.body);
                if (!Form_1.FormModel || typeof Form_1.FormModel.create !== 'function') {
                    console.error("❌ [FormController.createForm] FormModel is invalid or create method missing");
                    return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                        status: "error",
                        message: "FormModel is not properly initialized"
                    });
                }
                // Generate a unique slug for the form
                const slug = (0, slug_1.generateUniqueSlug)(req.body.name);
                console.log("🔵 [FormController.createForm] Generated slug:", slug);
                const form = yield Form_1.FormModel.create(Object.assign(Object.assign({}, req.body), { userId, slug }));
                console.log("✅ [FormController.createForm] Form created successfully:", form._id);
                // Generate public link using slug (friendlier URL)
                const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
                const publicLink = `${baseUrl}/api/v1/forms/s/${form.slug}`;
                const submissionLink = `${baseUrl}/api/v1/forms/s/${form.slug}/submit`;
                console.log("✅ [FormController.createForm] Public link generated:", publicLink);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    form,
                    publicLink,
                    submissionLink,
                    message: "Form created successfully. Share the publicLink with others to collect submissions."
                });
            }
            catch (error) {
                console.error("❌ [FormController.createForm] Error:", error);
                const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: errorMessage
                });
            }
        });
        // PUBLIC: Get Form Schema for Rendering the UI
        this.getPublicForm = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const form = yield Form_1.FormModel.findById(req.params.formId).select("name fields isActive");
            if (!form)
                return res.status(404).json({ message: "Form not found" });
            res.json(form);
        });
        // PUBLIC: Get Form by Slug (Friendly URL)
        this.getPublicFormBySlug = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const form = yield Form_1.FormModel.findOne({ slug: req.params.slug }).select("name fields isActive _id");
            if (!form)
                return res.status(404).json({ message: "Form not found" });
            res.json(form);
        });
        // PUBLIC: Submit Form Data
        this.postSubmission = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🔵 [FormController.postSubmission] Form submission started for formId:", req.params.formId);
                console.log("🔵 [FormController.postSubmission] Submission data:", req.body);
                // Fetch the form schema
                const form = yield Form_1.FormModel.findById(req.params.formId);
                if (!form) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: "Form not found" });
                }
                // Normalize field names - handles multiple variations of field names
                const normalizeFieldNames = (data, formFields) => {
                    const normalizedData = {};
                    formFields.forEach((field) => {
                        const label = field.label; // e.g., "Email Address"
                        const normalizedKey = label.replace(/\s+/g, '').toLowerCase(); // e.g., "emailaddress"
                        // Try multiple variations to find the value
                        const possibleKeys = [
                            label, // "Email Address"
                            label.toLowerCase(), // "email address"
                            normalizedKey, // "emailaddress"
                            label.split(' ')[0].toLowerCase(), // "email" (first word)
                            field.type, // "email" (field type)
                        ];
                        // Find the first matching key in the submitted data
                        let value = undefined;
                        for (const key of possibleKeys) {
                            if (data[key] !== undefined) {
                                value = data[key];
                                break;
                            }
                        }
                        // Also check case-insensitive match against all data keys
                        if (value === undefined) {
                            const dataKeys = Object.keys(data);
                            for (const dataKey of dataKeys) {
                                if (dataKey.toLowerCase() === normalizedKey ||
                                    dataKey.replace(/\s+/g, '').toLowerCase() === normalizedKey) {
                                    value = data[dataKey];
                                    break;
                                }
                            }
                        }
                        normalizedData[normalizedKey] = value;
                    });
                    return normalizedData;
                };
                const normalizedSubmissionData = normalizeFieldNames(req.body.submissionData, form.fields);
                console.log("🔵 [FormController.postSubmission] Normalized data:", normalizedSubmissionData);
                // Validate required fields
                const validateRequiredFields = (data, formFields) => {
                    const missingFields = formFields
                        .filter((field) => field.required)
                        .map((field) => field.label.replace(/\s+/g, '').toLowerCase())
                        .filter((key) => !data[key]);
                    if (missingFields.length > 0) {
                        throw new Error(`${missingFields.join(', ')} field(s) are required`);
                    }
                };
                try {
                    validateRequiredFields(normalizedSubmissionData, form.fields);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Validation failed";
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: errorMessage });
                }
                // Submit the form
                const submission = yield formService.submitForm(req.params.formId, normalizedSubmissionData);
                console.log("✅ [FormController.postSubmission] Submission created successfully:", submission._id);
                const response = {
                    success: true,
                    message: "Submitted successfully",
                    submissionId: submission._id,
                    contactId: submission.contactId
                };
                console.log("✅ [FormController.postSubmission] API Response:", JSON.stringify(response, null, 2));
                res.status(http_status_codes_1.StatusCodes.OK).json(response);
            }
            catch (err) {
                console.error("❌ [FormController.postSubmission] Error:", err.message);
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: err.message });
            }
        });
        // PUBLIC: Submit Form Data by Slug (Friendly URL)
        this.postSubmissionBySlug = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🔵 [FormController.postSubmissionBySlug] Form submission started for slug:", req.params.slug);
                console.log("🔵 [FormController.postSubmissionBySlug] Submission data:", req.body);
                // Fetch the form schema by slug
                const form = yield Form_1.FormModel.findOne({ slug: req.params.slug });
                if (!form) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: "Form not found" });
                }
                // Use the same normalization logic
                const normalizeFieldNames = (data, formFields) => {
                    const normalizedData = {};
                    formFields.forEach((field) => {
                        const label = field.label;
                        const normalizedKey = label.replace(/\s+/g, '').toLowerCase();
                        const possibleKeys = [
                            label,
                            label.toLowerCase(),
                            normalizedKey,
                            label.split(' ')[0].toLowerCase(),
                            field.type,
                        ];
                        let value = undefined;
                        for (const key of possibleKeys) {
                            if (data[key] !== undefined) {
                                value = data[key];
                                break;
                            }
                        }
                        if (value === undefined) {
                            const dataKeys = Object.keys(data);
                            for (const dataKey of dataKeys) {
                                if (dataKey.toLowerCase() === normalizedKey ||
                                    dataKey.replace(/\s+/g, '').toLowerCase() === normalizedKey) {
                                    value = data[dataKey];
                                    break;
                                }
                            }
                        }
                        normalizedData[normalizedKey] = value;
                    });
                    return normalizedData;
                };
                // Support both { submissionData: {...} } and direct field submission {...}
                const submissionData = req.body.submissionData || req.body;
                const normalizedSubmissionData = normalizeFieldNames(submissionData, form.fields);
                console.log("🔵 [FormController.postSubmissionBySlug] Normalized data:", normalizedSubmissionData);
                // Validate required fields
                const validateRequiredFields = (data, formFields) => {
                    const missingFields = formFields
                        .filter((field) => field.required)
                        .map((field) => field.label.replace(/\s+/g, '').toLowerCase())
                        .filter((key) => !data[key]);
                    if (missingFields.length > 0) {
                        throw new Error(`${missingFields.join(', ')} field(s) are required`);
                    }
                };
                try {
                    validateRequiredFields(normalizedSubmissionData, form.fields);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Validation failed";
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: errorMessage });
                }
                // Submit the form using form._id
                const submission = yield formService.submitForm(form._id.toString(), normalizedSubmissionData);
                console.log("✅ [FormController.postSubmissionBySlug] Submission created successfully:", submission._id);
                const response = {
                    success: true,
                    message: "Submitted successfully",
                    submissionId: submission._id,
                    contactId: submission.contactId
                };
                console.log("✅ [FormController.postSubmissionBySlug] API Response:", JSON.stringify(response, null, 2));
                res.status(http_status_codes_1.StatusCodes.OK).json(response);
            }
            catch (err) {
                console.error("❌ [FormController.postSubmissionBySlug] Error:", err.message);
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: err.message });
            }
        });
        // GET SUBMISSIONS (Table View)
        this.getSubmissions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                const data = yield formService.getSubmissions(userId, req.params.formId);
                res.json(data);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
                res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    status: "error",
                    message: errorMessage
                });
            }
        });
        // DELETE FORM
        this.deleteForm = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log("🔵 [FormController.deleteForm] Deleting form:", req.params.formId);
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                const { formId } = req.params;
                const result = yield formService.deleteForm(userId, formId);
                if (result.deletedCount === 0) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Form not found or you don't have permission to delete it"
                    });
                }
                console.log("✅ [FormController.deleteForm] Form deleted successfully");
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Form deleted successfully"
                });
            }
            catch (error) {
                console.error("❌ [FormController.deleteForm] Error:", error);
                const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: errorMessage
                });
            }
        });
    }
}
exports.FormController = FormController;
