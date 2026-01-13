"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("../controllers/campaign.controller");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const campaignRoute = (0, express_1.Router)();
const CampController = new campaign_controller_1.CampaignController();
// Basic campaign endpoints
campaignRoute.post("/", Auth_middlewares_1.isAuthenticated, CampController.createCampaign);
campaignRoute.get("/search", Auth_middlewares_1.isAuthenticated, CampController.searchCampaigns);
campaignRoute.get("/", Auth_middlewares_1.isAuthenticated, CampController.getAllCampaigns);
campaignRoute.get("/:id", Auth_middlewares_1.isAuthenticated, CampController.getCampaignById);
campaignRoute.put("/:id", Auth_middlewares_1.isAuthenticated, CampController.updateCampaign);
campaignRoute.delete("/:id", Auth_middlewares_1.isAuthenticated, CampController.deleteCampaign);
campaignRoute.post("/start", Auth_middlewares_1.isAuthenticated, CampController.startCampaign);
campaignRoute.post("/add-email-list", Auth_middlewares_1.isAuthenticated, CampController.addEmailListToCampaign);
campaignRoute.get("/:id/with-email-list", Auth_middlewares_1.isAuthenticated, CampController.getCampaignWithEmailList);
// Advanced settings - Single unified endpoint
campaignRoute.post("/:campaignId/advanced-settings", Auth_middlewares_1.isAuthenticated, CampController.manageAdvancedSettings);
exports.default = campaignRoute;
