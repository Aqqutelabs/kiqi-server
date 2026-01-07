import express from "express";
import { FormController } from "../controllers/form.controller";
import { verifyJWT } from "../middlewares/Auth.middlewares";
import { FormModel } from "../models/Form";

const formRouter = express.Router();
const ctrl = new FormController();

console.log("🔵 [form.routes] FormModel loaded:", typeof FormModel);
console.log("🔵 [form.routes] FormController loaded:", typeof FormController);

// PUBLIC ROUTES (Used by the Hosted Form Link & Iframe)
formRouter.get("/public/:formId", ctrl.getPublicForm);
formRouter.post("/public/:formId/submit", ctrl.postSubmission);

// PROTECTED ROUTES (Dashboard)
formRouter.use(verifyJWT);
formRouter.post("/", (req, res, next) => {
  console.log("🟡 [form.routes] POST / endpoint hit");
  ctrl.createForm(req, res);
});
formRouter.get("/:formId/submissions", ctrl.getSubmissions);
formRouter.delete("/:formId", ctrl.deleteForm);
formRouter.get("/", async (req, res) => {
  try {
    console.log("🟡 [form.routes] GET / endpoint hit");
    const userId = (req.user?._id || req.user?.id) as string;
    console.log("🔵 [form.routes] Fetching forms for userId:", userId);
    const forms = await FormModel.find({ userId }).sort({ createdAt: -1 });
    console.log("✅ [form.routes] Forms fetched:", forms.length);
    res.json({ error: false, forms });
  } catch (error) {
    console.error("❌ [form.routes] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ 
      status: "error", 
      message: errorMessage 
    });
  }
});

export default formRouter;