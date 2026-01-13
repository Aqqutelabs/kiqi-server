import { NextFunction, Request, Response } from "express";
import { CampaignServiceImpl } from "../services/impl/campaign.service.impl";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError";
import { AdvancedSettingsValidator, AdvancedSettingsDefaults, AdvancedEmailSettingsDto } from "../dtos/advancedCampaignSettings.dto";
import { AdvancedCampaignSettingsService } from "../services/advancedCampaignSettings.service";

/**
 * Handles HTTP requests related to email campaigns.
 * Interacts with CampaignServiceImpl for business logic.
 */
export class CampaignController {
    private campaignService: CampaignServiceImpl;
    private advancedSettingsService: AdvancedCampaignSettingsService;

    constructor(){
        this.campaignService = new CampaignServiceImpl();
        this.advancedSettingsService = new AdvancedCampaignSettingsService();
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
                
                const successMessage = scheduledAt 
                    ? "Campaign has been created and scheduled for later" 
                    : "Campaign has been created and scheduled to start immediately";
                
                const resBody: any = {
                    error: false,
                    message: successMessage,
                    data: response.campaign,
                    jobId: response.jobId
                };

                // Include sending error if one occurred, to help frontend debug
                if (response.sendingError) {
                    resBody.sendingError = response.sendingError;
                }

                res.status(StatusCodes.CREATED).json(resBody);
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

    /**
     * Unified endpoint for managing advanced email campaign settings
     * POST /api/v1/campaigns/:campaignId/advanced-settings
     * 
     * Supports operations via query parameter:
     * - POST with body: Save/update settings
     * - POST with ?action=get: Retrieve settings
     * - POST with ?action=validate: Validate settings
     * - POST with ?action=defaults: Get default settings
     * - POST with ?action=check-batch&totalRecipients=X: Check batch feasibility
     * - POST with ?action=batch-status&jobId=X: Get batch job status
     */
    public manageAdvancedSettings = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const campaignId = req.params.campaignId as string;
            const userId = req.user?._id as string;
            const action = (req.query.action as string) || 'save';

            if (!userId && action !== 'defaults' && action !== 'validate') {
                throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
            }

            switch (action) {
                case 'save':
                case 'update':
                    return this.saveAdvancedSettings(campaignId, userId, req.body, res, next);

                case 'get':
                    return this.getAdvancedSettings(campaignId, userId, res, next);

                case 'validate':
                    return this.validateAdvancedSettings(req.body, res, next);

                case 'defaults':
                    return this.getDefaultAdvancedSettings(res, next);

                case 'check-batch':
                    return this.validateBatchSending(campaignId, userId, req.body.totalRecipients, res, next);

                case 'batch-status':
                    return this.getBatchJobStatus(req.query.jobId as string, res, next);

                default:
                    throw new ApiError(StatusCodes.BAD_REQUEST, `Unknown action: ${action}`);
            }
        } catch (error) {
            next(error);
        }
    };

    private saveAdvancedSettings = async (
        campaignId: string,
        userId: string,
        body: any,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const advancedSettings: Partial<AdvancedEmailSettingsDto> = body;

            // Merge with defaults
            const finalSettings = AdvancedSettingsDefaults.mergeWithDefaults(advancedSettings);

            // Validate settings
            const validation = AdvancedSettingsValidator.validateAdvancedSettings(finalSettings);
            if (!validation.valid) {
                throw new ApiError(StatusCodes.BAD_REQUEST, `Validation failed: ${validation.errors.join(", ")}`);
            }

            // Save settings to campaign
            const updated = await this.campaignService.updateAdvancedSettings(
                campaignId,
                userId,
                finalSettings
            );

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Advanced settings saved successfully",
                data: updated.advancedSettings
            });
        } catch (error) {
            next(error);
        }
    };

    private getAdvancedSettings = async (
        campaignId: string,
        userId: string,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const campaign = await this.campaignService.getCampaignById(campaignId, userId);

            if (!campaign) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");
            }

            const settings = (campaign as any).advancedSettings || AdvancedSettingsDefaults.getDefaults();

            res.status(StatusCodes.OK).json({
                error: false,
                data: settings
            });
        } catch (error) {
            next(error);
        }
    };

    private validateAdvancedSettings = async (
        settings: any,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const validation = AdvancedSettingsValidator.validateAdvancedSettings(settings);

            res.status(StatusCodes.OK).json({
                error: !validation.valid,
                valid: validation.valid,
                errors: validation.errors,
                data: settings
            });
        } catch (error) {
            next(error);
        }
    };

    private getDefaultAdvancedSettings = async (
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const defaults = AdvancedSettingsDefaults.getDefaults();

            res.status(StatusCodes.OK).json({
                error: false,
                data: defaults
            });
        } catch (error) {
            next(error);
        }
    };

    private validateBatchSending = async (
        campaignId: string,
        userId: string,
        totalRecipients: number,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const campaign = await this.campaignService.getCampaignById(campaignId, userId);
            if (!campaign) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Campaign not found");
            }

            const settings = (campaign as any).advancedSettings || AdvancedSettingsDefaults.getDefaults();
            const recipientCount = totalRecipients || 1000;

            const feasibility = this.advancedSettingsService.validateBatchSendingFeasibility(
                recipientCount,
                settings.batchSending.emailsPerBatch,
                settings.batchSending.intervalMinutes,
                settings.dailySendLimit
            );

            const schedule = this.advancedSettingsService.calculateBatchSchedule(
                recipientCount,
                settings.batchSending.emailsPerBatch,
                settings.batchSending.intervalMinutes
            );

            res.status(StatusCodes.OK).json({
                error: false,
                feasible: feasibility.feasible,
                estimatedTimeMinutes: feasibility.estimatedTime,
                batchCount: Math.ceil(recipientCount / settings.batchSending.emailsPerBatch),
                schedule,
                issues: feasibility.issues,
                data: {
                    dailyLimit: settings.dailySendLimit,
                    emailsPerBatch: settings.batchSending.emailsPerBatch,
                    intervalMinutes: settings.batchSending.intervalMinutes
                }
            });
        } catch (error) {
            next(error);
        }
    };

    private getBatchJobStatus = async (
        jobId: string,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const jobStatus = this.advancedSettingsService.getBatchJobStatus(jobId);

            if (!jobStatus) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Batch job not found");
            }

            const progressPercentage = (jobStatus.sentCount / jobStatus.totalRecipients) * 100;

            res.status(StatusCodes.OK).json({
                error: false,
                data: {
                    jobId: jobStatus.jobId,
                    campaignId: jobStatus.campaignId,
                    totalRecipients: jobStatus.totalRecipients,
                    sentCount: jobStatus.sentCount,
                    remainingCount: jobStatus.totalRecipients - jobStatus.sentCount,
                    progressPercentage: Math.round(progressPercentage),
                    currentBatchIndex: jobStatus.currentBatchIndex,
                    createdAt: jobStatus.createdAt,
                    lastExecuted: jobStatus.lastExecuted
                }
            });
        } catch (error) {
            next(error);
        }
    };
}
