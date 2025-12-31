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
exports.ContactController = void 0;
const http_status_codes_1 = require("http-status-codes");
const CampaignContact_service_impl_1 = require("../services/CampaignContact.service.impl");
class ContactController {
    constructor() {
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                const contact = yield this.contactService.createContact(userId, req.body);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({ error: false, contact });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: errorMessage
                });
            }
        });
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                // Extract query params for search & pagination
                const result = yield this.contactService.getContacts(userId, req.query);
                res.status(http_status_codes_1.StatusCodes.OK).json(Object.assign({ error: false }, result));
            }
            catch (error) {
                next(error);
            }
        });
        this.getById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                const { id } = req.params;
                const { CampaignContactModel } = yield Promise.resolve().then(() => __importStar(require("../models/CampaignContact")));
                const contact = yield CampaignContactModel.findOne({ _id: id, userId });
                if (!contact) {
                    return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ error: true, message: "Contact not found" });
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, contact });
            }
            catch (error) {
                next(error);
            }
        });
        this.bulkDelete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                const { ids } = req.body; // Expecting array of IDs
                if (!Array.isArray(ids)) {
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: "IDs must be an array" });
                }
                yield this.contactService.bulkDelete(userId, ids);
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: "Contacts deleted successfully" });
            }
            catch (error) {
                next(error);
            }
        });
        // IMPORT CONTACTS FROM CSV
        this.importCSV = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log("🔵 [ContactController.importCSV] Starting CSV import");
                console.log("🔵 [ContactController.importCSV] File info:", req.file ? {
                    fieldname: req.file.fieldname,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                } : "No file");
                const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
                if (!req.file) {
                    console.warn("⚠️ [ContactController.importCSV] No file uploaded");
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "No file uploaded. Please send a CSV file with field name 'file'"
                    });
                }
                // Validate file type
                if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
                    console.warn("⚠️ [ContactController.importCSV] Invalid file type:", req.file.mimetype);
                    return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Only CSV files are allowed"
                    });
                }
                // Convert buffer to string
                const csvData = req.file.buffer.toString('utf-8');
                console.log("🔵 [ContactController.importCSV] CSV data length:", csvData.length);
                const result = yield this.contactService.importFromCSV(userId, csvData);
                console.log("✅ [ContactController.importCSV] Import successful:", { imported: result.imported, skipped: result.skipped });
                res.status(http_status_codes_1.StatusCodes.OK).json(Object.assign({ error: false, message: `Successfully imported ${result.imported} contacts${result.skipped > 0 ? ` (${result.skipped} rows skipped)` : ''}` }, result));
            }
            catch (error) {
                console.error("❌ [ContactController.importCSV] Error:", error);
                const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: "error",
                    message: errorMessage
                });
            }
        });
        this.contactService = new CampaignContact_service_impl_1.ContactService();
    }
}
exports.ContactController = ContactController;
