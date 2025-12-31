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
      res.status(StatusCodes.OK).json({ error: false, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id || req.user?.id) as string;
      const { id } = req.params;
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