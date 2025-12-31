import { Request, Response, NextFunction } from "express";
import { FormService } from "../services/impl/form.service.impl";
import { FormModel } from "../models/Form";
import { StatusCodes } from "http-status-codes";

const formService = new FormService();

export class FormController {
  // CREATE FORM (Builder)
  public createForm = async (req: Request, res: Response) => {
    try {
      console.log("🔵 [FormController.createForm] Starting form creation");
      console.log("🔵 [FormController.createForm] FormModel type:", typeof FormModel);
      console.log("🔵 [FormController.createForm] FormModel keys:", Object.keys(FormModel || {}));
      
      const userId = (req.user?._id || req.user?.id) as string;
      console.log("🔵 [FormController.createForm] userId:", userId);
      console.log("🔵 [FormController.createForm] Request body:", req.body);
      
      if (!FormModel || typeof FormModel.create !== 'function') {
        console.error("❌ [FormController.createForm] FormModel is invalid or create method missing");
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
          status: "error", 
          message: "FormModel is not properly initialized" 
        });
      }
      
      const form = await FormModel.create({ ...req.body, userId });
      console.log("✅ [FormController.createForm] Form created successfully:", form._id);
      
      // Generate public link
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
      const publicLink = `${baseUrl}/api/v1/forms/public/${form._id}`;
      const submissionLink = `${baseUrl}/api/v1/forms/public/${form._id}/submit`;
      
      console.log("✅ [FormController.createForm] Public link generated:", publicLink);
      
      res.status(StatusCodes.CREATED).json({ 
        error: false, 
        form,
        publicLink,
        submissionLink,
        message: "Form created successfully. Share the publicLink with others to collect submissions."
      });
    } catch (error) {
      console.error("❌ [FormController.createForm] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.BAD_REQUEST).json({ 
        status: "error", 
        message: errorMessage 
      });
    }
  };

  // PUBLIC: Get Form Schema for Rendering the UI
  public getPublicForm = async (req: Request, res: Response) => {
    const form = await FormModel.findById(req.params.formId).select("name fields isActive");
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  };

  // PUBLIC: Submit Form Data
  public postSubmission = async (req: Request, res: Response) => {
    try {
      console.log("🔵 [FormController.postSubmission] Form submission started for formId:", req.params.formId);
      console.log("🔵 [FormController.postSubmission] Submission data:", req.body);
      
      const submission = await formService.submitForm(req.params.formId, req.body);
      console.log("✅ [FormController.postSubmission] Submission created successfully:", submission._id);
      res.status(StatusCodes.OK).json({ success: true, message: "Submitted successfully" });
    } catch (err: any) {
      console.error("❌ [FormController.postSubmission] Error:", err.message);
      res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: err.message });
    }
  };

  // GET SUBMISSIONS (Table View)
  public getSubmissions = async (req: Request, res: Response) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const data = await formService.getSubmissions(userId, req.params.formId);
      res.json(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        status: "error", 
        message: errorMessage 
      });
    }
  };
}