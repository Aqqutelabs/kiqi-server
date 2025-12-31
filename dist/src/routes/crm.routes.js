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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const CampaignContact_controller_1 = require("../controllers/CampaignContact.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const list_service_impl_1 = require("../services/impl/list.service.impl");
const http_status_codes_1 = require("http-status-codes");
const contactRouter = express_1.default.Router();
const contactController = new CampaignContact_controller_1.ContactController();
const listService = new list_service_impl_1.ListService();
// Multer configuration for CSV uploads (store in memory)
// Accepts field names: file, csv, or attachment
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// Helper middleware to handle file upload errors
const handleUploadError = (err, req, res, next) => {
    if (err) {
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                error: true,
                message: `Unexpected field name "${err.field}". Use field name "file" or "csv"`
            });
        }
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            error: true,
            message: err.message || 'File upload error'
        });
    }
    next();
};
// All CRM routes require authentication
contactRouter.use(Auth_middlewares_1.verifyJWT);
// Contact Routes - More specific routes first
contactRouter.post("/import-csv", upload.single("file"), contactController.importCSV);
contactRouter.post("/bulk-delete", contactController.bulkDelete);
// Generic contact routes
contactRouter.get("/", contactController.getAll);
contactRouter.post("/", contactController.create);
contactRouter.get("/:id", contactController.getById);
// List Routes
contactRouter.get("/lists", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const lists = yield listService.getListsForUser(userId);
    res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, lists });
}));
contactRouter.post("/lists", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const { name, description } = req.body;
    const list = yield listService.createList(userId, name, description);
    res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, list });
}));
contactRouter.post("/lists/:id/add-contacts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
    const { contactIds } = req.body;
    const list = yield listService.addContactsToList(userId, req.params.id, contactIds);
    res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, list });
}));
contactRouter.delete("/lists/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
        const { id } = req.params;
        const result = yield listService.deleteList(userId, id);
        if (result.deletedCount === 0) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                error: true,
                message: "List not found or you don't have permission to delete it"
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            error: false,
            message: "List deleted successfully"
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            message: errorMessage
        });
    }
}));
exports.default = contactRouter;
