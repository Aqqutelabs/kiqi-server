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
                const form = yield Form_1.FormModel.create(Object.assign(Object.assign({}, req.body), { userId }));
                console.log("✅ [FormController.createForm] Form created successfully:", form._id);
                // Generate public link
                const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
                const publicLink = `${baseUrl}/api/v1/forms/public/${form._id}`;
                const submissionLink = `${baseUrl}/api/v1/forms/public/${form._id}/submit`;
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
        // PUBLIC: Submit Form Data
        this.postSubmission = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("🔵 [FormController.postSubmission] Form submission started for formId:", req.params.formId);
                console.log("🔵 [FormController.postSubmission] Submission data:", req.body);
                const submission = yield formService.submitForm(req.params.formId, req.body);
                console.log("✅ [FormController.postSubmission] Submission created successfully:", submission._id);
                res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Submitted successfully" });
            }
            catch (err) {
                console.error("❌ [FormController.postSubmission] Error:", err.message);
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
    }
}
exports.FormController = FormController;
