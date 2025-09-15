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
campaignRoute.post("/start", isAuthenticated, CampController.startCampaign);
campaignRoute.post("/add-email-list", isAuthenticated, CampController.addEmailListToCampaign);
campaignRoute.get("/:id/with-email-list", isAuthenticated, CampController.getCampaignWithEmailList);

export default campaignRoute;