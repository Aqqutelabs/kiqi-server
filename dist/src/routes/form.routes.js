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
const form_controller_1 = require("../controllers/form.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const Form_1 = require("../models/Form");
const formRouter = express_1.default.Router();
const ctrl = new form_controller_1.FormController();
console.log("🔵 [form.routes] FormModel loaded:", typeof Form_1.FormModel);
console.log("🔵 [form.routes] FormController loaded:", typeof form_controller_1.FormController);
// PUBLIC ROUTES (Used by the Hosted Form Link & Iframe)
// Slug-based routes (friendly URLs) - must come before :formId routes
formRouter.get("/s/:slug", ctrl.getPublicFormBySlug);
formRouter.post("/s/:slug/submit", ctrl.postSubmissionBySlug);
// Legacy ID-based routes (for backward compatibility)
formRouter.get("/public/:formId", ctrl.getPublicForm);
formRouter.post("/public/:formId/submit", ctrl.postSubmission);
// PROTECTED ROUTES (Dashboard)
formRouter.use(Auth_middlewares_1.verifyJWT);
formRouter.post("/", (req, res, next) => {
    console.log("🟡 [form.routes] POST / endpoint hit");
    ctrl.createForm(req, res);
});
formRouter.get("/:formId/submissions", ctrl.getSubmissions);
formRouter.delete("/:formId", ctrl.deleteForm);
formRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log("🟡 [form.routes] GET / endpoint hit");
        const userId = (((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
        console.log("🔵 [form.routes] Fetching forms for userId:", userId);
        const forms = yield Form_1.FormModel.find({ userId }).sort({ createdAt: -1 });
        console.log("✅ [form.routes] Forms fetched:", forms.length);
        res.json({ error: false, forms });
    }
    catch (error) {
        console.error("❌ [form.routes] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        res.status(500).json({
            status: "error",
            message: errorMessage
        });
    }
}));
exports.default = formRouter;
