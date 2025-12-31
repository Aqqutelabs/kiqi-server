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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMCampaignController = void 0;
const smCampaign_service_impl_1 = require("../services/impl/smCampaign.service.impl");
const http_status_codes_1 = require("http-status-codes");
class SMCampaignController {
    constructor() {
        this.createSMCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { channel, category, name, task_type, instructions, url, budget, noOfParticipants, reward, start_date, end_date, action, schedule_date, schedule_time, } = req.body;
                // Handle uploaded file
                let file;
                if (req.file && req.file.filename) {
                    file = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
                }
                let is_published = false;
                // Validate action
                if (!action || !["publish", "schedule"].includes(action)) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Invalid or missing action. Must be 'publish' or 'schedule'.",
                    });
                    return;
                }
                // Validate schedule fields if scheduling later
                if (action === "schedule" && (!schedule_date || !schedule_time)) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Schedule date and time are required.",
                    });
                    return;
                }
                // Set schedule_date and schedule_time appropriately
                let finalScheduleDate = schedule_date;
                let finalScheduleTime = schedule_time;
                if (action === "publish") {
                    const now = new Date();
                    is_published = true;
                    finalScheduleDate = now;
                    finalScheduleTime = now.toTimeString().slice(0, 5); // "HH:mm" format
                }
                const campaign = yield this.smCampaignService.createSMCampaign({
                    channel,
                    category,
                    name,
                    task_type,
                    instructions,
                    url,
                    file,
                    budget,
                    noOfParticipants,
                    reward,
                    action,
                    start_date,
                    end_date,
                    schedule_date: finalScheduleDate,
                    schedule_time: finalScheduleTime,
                    is_published,
                });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: action === "publish"
                        ? "Campaign published successfully."
                        : "Campaign scheduled successfully.",
                    data: campaign,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllSMCampaigns = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const campaigns = yield this.smCampaignService.getAllSMCampaigns();
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: campaigns,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getSMCampaignById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const campaign = yield this.smCampaignService.getSMCampaignById(id);
                if (!campaign) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Campaign not found",
                    });
                    return;
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: campaign,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteSMCampaign = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.smCampaignService.deleteSMCampaign(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Campaign has been deleted successfully",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.smCampaignService = new smCampaign_service_impl_1.SMCampaignImpl();
    }
}
exports.SMCampaignController = SMCampaignController;
