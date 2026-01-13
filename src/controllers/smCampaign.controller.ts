import { Response, Request, NextFunction } from "express";
import { SMCampaignImpl } from "../services/impl/smCampaign.service.impl";
import { StatusCodes } from "http-status-codes";


export class SMCampaignController {
    private smCampaignService: SMCampaignImpl
    
        constructor(){
            this.smCampaignService = new SMCampaignImpl();
        }

    public createSMCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                channel,
                category,
                name,
                task_type,
                instructions,
                url,                
                budget,
                noOfParticipants,
                reward,
                start_date,
                end_date,
                action,
                schedule_date,
                schedule_time,
            } = req.body;

            // Handle uploaded file
            let file: string | undefined;
            if (req.file && req.file.filename) {
                file = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
            }
            let is_published = false;

            // Validate action
            if (!action || !["publish", "schedule"].includes(action)) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "Invalid or missing action. Must be 'publish' or 'schedule'.",
                });
                return;
            }

            // Validate schedule fields if scheduling later
            if (action === "schedule" && (!schedule_date || !schedule_time)) {
                res.status(StatusCodes.BAD_REQUEST).json({
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

            const campaign = await this.smCampaignService.createSMCampaign({
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

            res.status(StatusCodes.CREATED).json({
                error: false,
                message:
                    action === "publish"
                        ? "Campaign published successfully."
                        : "Campaign scheduled successfully.",
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    };

    public getAllSMCampaigns = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const campaigns = await this.smCampaignService.getAllSMCampaigns();

            res.status(StatusCodes.OK).json({
                error: false,
                data: campaigns,
            });
        } catch (error) {
            next(error);
        }
    };

    public getSMCampaignById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id;
            const campaign = await this.smCampaignService.getSMCampaignById(id);

            if (!campaign) {
                res.status(StatusCodes.NOT_FOUND).json({
                    error: true,
                    message: "Campaign not found",
                });
                return;
            }

            res.status(StatusCodes.OK).json({
                error: false,
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteSMCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id;
            await this.smCampaignService.deleteSMCampaign(id);

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Campaign has been deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };    
}