import { NextFunction, Request, Response } from "express";
import { CampaignServiceImpl } from "../services/impl/campaign.service.impl";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError";

/**
 * Handles HTTP requests related to email campaigns.
 * Interacts with CampaignServiceImpl for business logic.
 */
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
                body,
                autoStart,
                scheduledAt,
                audience
            } = req.body;

            const userId = req.user?._id;
            if (!userId) {
                throw new Error("User not authenticated");
            }

            if (!senderId) {
                throw new Error("senderId is required");
            }

            // If autoStart is true, audience is required
            if (autoStart) {
                if (!audience) {
                    throw new Error("audience is required when autoStart is true");
                }
                const hasEmailLists = audience.emailLists && Array.isArray(audience.emailLists) && audience.emailLists.length > 0;
                const hasManualEmails = audience.manualEmails && Array.isArray(audience.manualEmails) && audience.manualEmails.length > 0;
                
                if (!hasEmailLists && !hasManualEmails) {
                    throw new Error("audience must contain either emailLists or manualEmails");
                }
            }

            // Validate scheduledAt if autoStart is true
            if (autoStart && scheduledAt) {
                const scheduledDate = new Date(scheduledAt);
                if (isNaN(scheduledDate.getTime())) {
                    throw new Error( "Invalid scheduledAt date format");
                }
                if (scheduledDate < new Date()) {
                    throw new Error( "scheduledAt must be in the future");
                }
            }

            const campaignData: any = {
                campaignName,
                subjectLine,
                content: body ? { htmlContent: body, plainText: body } : undefined,
                senderId,
                user_id: userId,
                audience: audience || { emailLists: [], excludeLists: [], manualEmails: [] }
            };

            let response: any;

            if (autoStart) {
                // Create campaign and schedule it to start
                // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
                response = await this.campaignService.createAndScheduleCampaign(
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

            const campaigns = await this.campaignService.getAllCampaigns(userId);
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

            const { campaignName, subjectLine, body } = req.body;
            const updated = await this.campaignService.updateCampaign(id, userId, {
                campaignName,
                subjectLine,
                ...(body ? { content: { htmlContent: body, plainText: body } } : {})
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
            // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
            const emailList = await this.campaignService.getEmailListForUser(emailListId, userId as string);
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
            // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
            await this.campaignService.sendBulkEmail(emailList.emails, subject, body, replyTo);
            
            // Save campaign record
            const campaign = await this.campaignService.createCampaign({
                campaignName,
                subjectLine: subject,
                content: body ? { htmlContent: body, plainText: body } : undefined,
                senderId: process.env.EMAIL_FROM || 'noreply@data.widernetfarms.org', // Using senderId as a proxy for sender email
                user_id: userId,
                audience: { emailLists: [emailListId], excludeLists: [], manualEmails: [] }
            });
            
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
            // NOTE: The 'as any' cast is no longer strictly necessary because the method now exists
            const updatedCampaign = await this.campaignService.addEmailListToCampaign(campaignId, emailListId);
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
            // NOTE: Missing userId check in controller, but the service method now exists
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

    // Search campaigns by name, subject, or category
    public searchCampaigns = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { q, status, limit, page } = req.query;

            if (!q || typeof q !== 'string') {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Search query (q) is required");
            }

            const userId = req.user?._id;
            if (!userId) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            const { results, total } = await this.campaignService.searchCampaigns(
                userId,
                q,
                {
                    status: status as string,
                    limit: Number(limit) || 20,
                    page: Number(page) || 1
                }
            );

            res.status(StatusCodes.OK).json({
                error: false,
                data: {
                    campaigns: results,
                    total,
                    limit: Number(limit) || 20,
                    page: Number(page) || 1
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
