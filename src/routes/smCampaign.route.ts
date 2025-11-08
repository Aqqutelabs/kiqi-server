import { Router } from "express";
import { isAuthenticated } from "../middlewares/Auth.middlewares";
import { SMCampaignController } from "../controllers/smCampaign.controller";
import upload from "../middlewares/Upload";

const smCampaignRouter = Router()
const smCampaignController = new SMCampaignController();

smCampaignRouter.post("/", isAuthenticated, upload.single("file"), smCampaignController.createSMCampaign);
smCampaignRouter.get("/:id", isAuthenticated, smCampaignController.getSMCampaignById);
smCampaignRouter.get("/", isAuthenticated, smCampaignController.getAllSMCampaigns);
smCampaignRouter.delete("/:id", isAuthenticated, smCampaignController.deleteSMCampaign)

export default smCampaignRouter