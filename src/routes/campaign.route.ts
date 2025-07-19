import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller";
import { isAuthenticated } from "../middlewares/Auth.middlewares";

const campaignRoute = Router()
const CampController = new CampaignController()

campaignRoute.post("/", isAuthenticated, CampController.createCampaign);
campaignRoute.get("/", isAuthenticated, CampController.getAllCampaigns);
campaignRoute.get("/:id", isAuthenticated, CampController.getCampaignById);
campaignRoute.put("/:id", isAuthenticated, CampController.updateCampaign);
campaignRoute.delete("/:id", isAuthenticated, CampController.deleteCampaign);

export default campaignRoute;