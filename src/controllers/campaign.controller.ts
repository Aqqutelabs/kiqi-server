import { NextFunction, Request, Response } from "express";
import { CampaignServiceImpl } from "../services/impl/campaign.service.impl";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError";

export class CampaignController {
    private campaignService: CampaignServiceImpl;

    constructor(){
        this.campaignService = new CampaignServiceImpl();
    }

    public createCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const {
                campaignName,
                subjectLine,
                senderId,
                autoStart,
                scheduledAt
            } = req.body;

            const userId = req.user?._id;
            if (!userId) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            if (!senderId) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "senderId is required");
            }

            // Validate scheduledAt if autoStart is true
            if (autoStart && scheduledAt) {
                const scheduledDate = new Date(scheduledAt);
                if (isNaN(scheduledDate.getTime())) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid scheduledAt date format");
                }
                if (scheduledDate < new Date()) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, "scheduledAt must be in the future");
                }
            }

            const campaignData: any = {
                campaignName,
                subjectLine,
                senderId,
                user_id: userId
            };

            let response: any;

            if (autoStart) {
                // Create campaign and schedule it to start
                response = await (this.campaignService as any).createAndScheduleCampaign(
                    campaignData,
                    scheduledAt ? new Date(scheduledAt) : new Date()
                );
                res.status(StatusCodes.CREATED).json({
                    error: false,
                    message: scheduledAt 
                        ? "Campaign has been created and scheduled for later" 
                        : "Campaign has been created and scheduled to start immediately",
                    data: response.campaign,
                    jobId: response.jobId
                });
            } else {
                // Just create campaign in Draft status
                const created = await this.campaignService.createCampaign(campaignData);
                res.status(StatusCodes.CREATED).json({
                    error: false,
                    message: "Campaign has been created",
                    data: created,
                });
            }
        } catch (error) {
            next(error);
        }
    };

    public getAllCampaigns = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?._id;
            if (!userId) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            const campaigns = await this.campaignService.getCampaigns(userId);
            res.status(StatusCodes.OK).json({
                error: false,
                data: campaigns
            });
        } catch (error) {
            next(error);
        }
    };

    public getCampaignById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id;
            const userId = req.user?._id;
            if (!userId) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            const campaign = await this.campaignService.getCampaignById(id, userId);

            res.status(StatusCodes.OK).json({
                error: false,
                data: campaign
            });
        } catch (error) {
            next(error);
        }
    };

    public updateCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id;
            const userId = req.user?._id;
            if (!userId) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            const { campaignName, subjectLine } = req.body;
            const updated = await this.campaignService.updateCampaign(id, userId, {
                campaignName,
                subjectLine
            });

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Campaign has been updated.",
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params.id;
            const userId = req.user?._id;
            if (!userId) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            await this.campaignService.deleteCampaign(id, userId);

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Campaign has been deleted",
            });
        } catch (error) {
            next(error);
        }
    }

    public startCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { campaignName, emailListId, subject, body, replyTo } = req.body;
            const userId = req.user?._id;
            if (!campaignName || !emailListId || !subject || !body || !replyTo) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "All fields (campaignName, emailListId, subject, body, replyTo) are required."
                });
                return;
            }
            if (!userId) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    error: true,
                    message: "User not authenticated."
                });
                return;
            }
            // Fetch email list and validate ownership
            const emailList = await (this.campaignService as any).getEmailListForUser(emailListId, userId as string);
            if (!emailList) {
                res.status(StatusCodes.NOT_FOUND).json({
                    error: true,
                    message: "Email list not found or does not belong to user."
                });
                return;
            }
            if (!emailList.emails || emailList.emails.length === 0) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "Email list is empty."
                });
                return;
            }
            // Send emails (use fixed sender, dynamic replyTo)
            await (this.campaignService as any).sendBulkEmail(emailList.emails, subject, body, replyTo);
            // Save campaign record
            const campaign = await this.campaignService.createCampaign({
                campaignName,
                subjectLine: subject,
                emailListIds: [emailListId],
                senderEmail: process.env.EMAIL_FROM || 'noreply@data.widernetfarms.org',
                user_id: userId
            } as any);
            res.status(StatusCodes.OK).json({
                error: false,
                message: "Campaign started and emails sent.",
                data: campaign
            });
        } catch (error) {
            next(error);
        }
    }

    // Add an email list to a campaign
    public addEmailListToCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { campaignId, emailListId } = req.body;
            if (!campaignId || !emailListId) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "Both campaignId and emailListId are required."
                });
                return;
            }
            // Update the campaign to reference the email list
            const updatedCampaign = await (this.campaignService as any).addEmailListToCampaign(campaignId, emailListId);
            if (!updatedCampaign) {
                res.status(StatusCodes.NOT_FOUND).json({
                    error: true,
                    message: "Campaign or Email List not found."
                });
                return;
            }
            res.status(StatusCodes.OK).json({
                error: false,
                message: "Email list added to campaign.",
                data: updatedCampaign
            });
        } catch (error) {
            next(error);
        }
    }

    // Fetch a campaign and its associated email list data
    public getCampaignWithEmailList = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const campaignWithList = await this.campaignService.getCampaignWithEmailList(id);
            if (!campaignWithList) {
                res.status(StatusCodes.NOT_FOUND).json({
                    error: true,
                    message: "Campaign not found."
                });
                return;
            }
            res.status(StatusCodes.OK).json({
                error: false,
                data: campaignWithList
            });
        } catch (error) {
            next(error);
        }
    }
}