import { Router } from "express";
import { isAuthenticated } from "../middlewares/Auth.middlewares";
import { TemplatesController } from "../controllers/template.controller";

const templateRouter = Router()
const templateController = new TemplatesController();

templateRouter.post("/", isAuthenticated, templateController.createTemplate);
templateRouter.get("/:id", isAuthenticated, templateController.getTemplateById);
templateRouter.get("/", isAuthenticated, templateController.getAllTemplates);
templateRouter.delete("/:id", isAuthenticated, templateController.deleteTemplates)

export default templateRouter