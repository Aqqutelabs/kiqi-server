"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const smCampaign_controller_1 = require("../controllers/smCampaign.controller");
const Upload_1 = __importDefault(require("../middlewares/Upload"));
const smCampaignRouter = (0, express_1.Router)();
const smCampaignController = new smCampaign_controller_1.SMCampaignController();
smCampaignRouter.post("/", Auth_middlewares_1.isAuthenticated, Upload_1.default.single("file"), smCampaignController.createSMCampaign);
smCampaignRouter.get("/:id", Auth_middlewares_1.isAuthenticated, smCampaignController.getSMCampaignById);
smCampaignRouter.get("/", Auth_middlewares_1.isAuthenticated, smCampaignController.getAllSMCampaigns);
smCampaignRouter.delete("/:id", Auth_middlewares_1.isAuthenticated, smCampaignController.deleteSMCampaign);
exports.default = smCampaignRouter;
