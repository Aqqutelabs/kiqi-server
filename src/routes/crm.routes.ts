import express from "express";
import multer from "multer";
import { ContactController } from "../controllers/CampaignContact.controller";
import { verifyJWT } from "../middlewares/Auth.middlewares";
import { ListService } from "../services/impl/list.service.impl";
import { StatusCodes } from "http-status-codes";

const contactRouter = express.Router();
const contactController = new ContactController();
const listService = new ListService();

// Multer configuration for CSV uploads (store in memory)
// Accepts field names: file, csv, or attachment
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper middleware to handle file upload errors
const handleUploadError = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: true,
        message: `Unexpected field name "${err.field}". Use field name "file" or "csv"`
      });
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: true,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// All CRM routes require authentication
contactRouter.use(verifyJWT);

// Contact Routes - More specific routes first
contactRouter.post("/import-csv", upload.single("file"), contactController.importCSV);
contactRouter.post("/bulk-delete", contactController.bulkDelete);

// Generic contact routes BEFORE parameterized routes
contactRouter.get("/", contactController.getAll);
contactRouter.post("/", contactController.create);

// List Routes - MUST come before generic /:id routes to prevent "lists" being treated as an ID
contactRouter.get("/lists", async (req, res) => {
  const userId = (req.user?._id || req.user?.id) as string;
  const lists = await listService.getListsForUser(userId);
  res.status(StatusCodes.OK).json({ error: false, lists });
});

contactRouter.post("/lists", async (req, res) => {
  const userId = (req.user?._id || req.user?.id) as string;
  const { name, description } = req.body;
  const list = await listService.createList(userId, name, description);
  res.status(StatusCodes.OK).json({ error: false, list });
});

contactRouter.get("/lists/:id", async (req, res) => {
  try {
    const userId = (req.user?._id || req.user?.id) as string;
    const { id } = req.params;
    const list = await listService.getListById(userId, id);
    
    if (!list) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: true, 
        message: "List not found or you don't have permission to view it" 
      });
    }
    
    res.status(StatusCodes.OK).json({ error: false, list });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: true, 
      message: errorMessage 
    });
  }
});

contactRouter.post("/lists/:id/add-contacts", async (req, res) => {
  const userId = (req.user?._id || req.user?.id) as string;
  const { contactIds } = req.body;
  const list = await listService.addContactsToList(userId, req.params.id, contactIds);
  res.status(StatusCodes.OK).json({ error: false, list });
});

contactRouter.delete("/lists/:id", async (req, res) => {
  try {
    const userId = (req.user?._id || req.user?.id) as string;
    const { id } = req.params;
    const result = await listService.deleteList(userId, id);
    
    if (result.deletedCount === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: true, 
        message: "List not found or you don't have permission to delete it" 
      });
    }
    
    res.status(StatusCodes.OK).json({ 
      error: false, 
      message: "List deleted successfully" 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      status: "error", 
      message: errorMessage 
    });
  }
});

// Update and delete contact by ID
contactRouter.put("/:id", contactController.updateContact);
contactRouter.delete("/:id", contactController.deleteContact);

// Parameterized contact routes - MUST come LAST
contactRouter.get("/:id", contactController.getById);

export default contactRouter;