import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ContactService } from "../services/CampaignContact.service.impl";

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const contact = await this.contactService.createContact(userId, req.body);
      res.status(StatusCodes.CREATED).json({ error: false, contact });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.BAD_REQUEST).json({ 
        status: "error", 
        message: errorMessage 
      });
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      // Extract query params for search & pagination
      const result = await this.contactService.getContacts(userId, req.query);

      // Fetch form leads count
      const formLeadsCount = await this.contactService.getFormLeads(userId);

      res.status(StatusCodes.OK).json({
        error: false,
        ...result,
        formLeads: formLeadsCount, // Return only the count of form leads
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const { id } = req.params;
      
      // Validate if id is a valid MongoDB ObjectId (24 hex characters)
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          error: true, 
          message: `Invalid contact ID "${id}". Expected a 24-character MongoDB ObjectId.` 
        });
      }
      
      const { CampaignContactModel } = await import("../models/CampaignContact");
      
      const contact = await CampaignContactModel.findOne({ _id: id, userId });
      if (!contact) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: true, message: "Contact not found" });
      }
      res.status(StatusCodes.OK).json({ error: false, contact });
    } catch (error) {
      next(error);
    }
  };

  public bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const { ids } = req.body; // Expecting array of IDs
      if (!Array.isArray(ids)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: true, message: "IDs must be an array" });
      }
      await this.contactService.bulkDelete(userId, ids);
      res.status(StatusCodes.OK).json({ error: false, message: "Contacts deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  public updateContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const { id } = req.params;
      
      // Validate if id is a valid MongoDB ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          error: true, 
          message: `Invalid contact ID "${id}". Expected a 24-character MongoDB ObjectId.` 
        });
      }

      const updatedContact = await this.contactService.updateContact(userId, id, req.body);
      
      if (!updatedContact) {
        return res.status(StatusCodes.NOT_FOUND).json({ 
          error: true, 
          message: "Contact not found or you don't have permission to update it" 
        });
      }
      
      res.status(StatusCodes.OK).json({ error: false, contact: updatedContact });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.BAD_REQUEST).json({ 
        error: true, 
        message: errorMessage 
      });
    }
  };

  public deleteContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const { id } = req.params;
      
      // Validate if id is a valid MongoDB ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          error: true, 
          message: `Invalid contact ID "${id}". Expected a 24-character MongoDB ObjectId.` 
        });
      }

      const { CampaignContactModel } = await import("../models/CampaignContact");
      const result = await CampaignContactModel.deleteOne({ _id: id, userId });
      
      if (result.deletedCount === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ 
          error: true, 
          message: "Contact not found or you don't have permission to delete it" 
        });
      }
      
      res.status(StatusCodes.OK).json({ error: false, message: "Contact deleted successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.BAD_REQUEST).json({ 
        error: true, 
        message: errorMessage 
      });
    }
  };

  // IMPORT CONTACTS FROM CSV
  public importCSV = async (req: Request, res: Response) => {
    try {
      console.log("🔵 [ContactController.importCSV] Starting CSV import");
      console.log("🔵 [ContactController.importCSV] File info:", req.file ? { 
        fieldname: req.file.fieldname, 
        originalname: req.file.originalname, 
        mimetype: req.file.mimetype, 
        size: req.file.size 
      } : "No file");
      
      const userId = (req.user?._id || req.user?.id) as string;
      
      if (!req.file) {
        console.warn("⚠️ [ContactController.importCSV] No file uploaded");
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          error: true, 
          message: "No file uploaded. Please send a CSV file with field name 'file'" 
        });
      }

      // Validate file type
      if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
        console.warn("⚠️ [ContactController.importCSV] Invalid file type:", req.file.mimetype);
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          error: true, 
          message: "Only CSV files are allowed" 
        });
      }

      // Convert buffer to string
      const csvData = req.file.buffer.toString('utf-8');
      console.log("🔵 [ContactController.importCSV] CSV data length:", csvData.length);

      const result = await this.contactService.importFromCSV(userId, csvData);
      console.log("✅ [ContactController.importCSV] Import successful:", { imported: result.imported, skipped: result.skipped });
      
      res.status(StatusCodes.OK).json({ 
        error: false, 
        message: `Successfully imported ${result.imported} contacts${result.skipped > 0 ? ` (${result.skipped} rows skipped)` : ''}`,
        ...result
      });
    } catch (error) {
      console.error("❌ [ContactController.importCSV] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
      res.status(StatusCodes.BAD_REQUEST).json({ 
        status: "error", 
        message: errorMessage 
      });
    }
  };
}