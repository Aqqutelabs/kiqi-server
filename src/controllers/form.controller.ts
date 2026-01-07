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

      // Fetch the form schema
      const form = await FormModel.findById(req.params.formId);
      if (!form) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: true, message: "Form not found" });
      }

      // Normalize field names - handles multiple variations of field names
      const normalizeFieldNames = (data: Record<string, any>, formFields: any[]) => {
        const normalizedData: Record<string, any> = {};
        formFields.forEach((field) => {
          const label = field.label; // e.g., "Email Address"
          const normalizedKey = label.replace(/\s+/g, '').toLowerCase(); // e.g., "emailaddress"
          
          // Try multiple variations to find the value
          const possibleKeys = [
            label,                                    // "Email Address"
            label.toLowerCase(),                      // "email address"
            normalizedKey,                            // "emailaddress"
            label.split(' ')[0].toLowerCase(),        // "email" (first word)
            field.type,                               // "email" (field type)
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
      const validateRequiredFields = (data: Record<string, any>, formFields: any[]) => {
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Validation failed";
        return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: errorMessage });
      }

      // Submit the form
      const submission = await formService.submitForm(req.params.formId, normalizedSubmissionData);
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

  // DELETE FORM
  public deleteForm = async (req: Request, res: Response) => {
    try {
      console.log("🔵 [FormController.deleteForm] Deleting form:", req.params.formId);
      const userId = (req.user?._id || req.user?.id) as string;
      const { formId } = req.params;

      const result = await formService.deleteForm(userId, formId);
      
      if (result.deletedCount === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: true,
          message: "Form not found or you don't have permission to delete it"
        });
      }

      console.log("✅ [FormController.deleteForm] Form deleted successfully");
      res.status(StatusCodes.OK).json({
        error: false,
        message: "Form deleted successfully"
      });
    } catch (error) {
      console.error("❌ [FormController.deleteForm] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.BAD_REQUEST).json({
        error: true,
        message: errorMessage
      });
    }
  };
}