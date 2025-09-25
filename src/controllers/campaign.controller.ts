import { NextFunction, Request, Response } from "express";
import { CampaignServiceImpl } from "../services/impl/campaign.service.impl";
import { StatusCodes } from "http-status-codes";

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
        try{
            // Accept all campaign fields from the request body
            const {
                campaignName,
                subjectLine,
                status,
                emailListIds,
                senderEmail,
                deliveryStatus,
                category,
                campaignTopic,
                instructions,
                reward,
                startDate,
                endDate,
                time
            } = req.body;
            const created = await this.campaignService.createCampaign({
                campaignName,
                subjectLine,
                status,
                emailListIds,
                senderEmail,
                deliveryStatus,
                category,
                campaignTopic,
                instructions,
                reward,
                startDate,
                endDate,
                time
            });

            res.status(StatusCodes.CREATED).json({
                error: false,
                message: "Campaign has been created",
                data: created,
            })
        } catch (error){
            next(error);
        }
    }

    public getAllCampaigns = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            
            const campaigns = await this.campaignService.getAllCampaigns();
            res.status(StatusCodes.OK).json({
                error: false,
                data: campaigns
            });
        } catch (error){
            next(error);
        }
    }

    public getCampaignById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id;
            const campaign = await this.campaignService.getCampaignById(id)

            res.status(StatusCodes.OK).json({
                error: false,
                data: campaign
            });
        } catch (error) {
            next(error)
        }
    }

    public updateCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id;
            const {campaignName, subjectLine} = req.body
            const updated = await this.campaignService.updateCampaign(id, {
                campaignName,
                subjectLine
            })

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Campaign has been updated.",
                data: updated,
            })
        } catch (error) {
            next(error);
        }
    }

    public deleteCampaign = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id
            const deleted = await this.campaignService.deleteCampaign(id);

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Campaign has been deleted",
            })
        } catch (error) {
            next(error)
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
            await this.campaignService.sendBulkEmail(emailList.emails, subject, body, replyTo);
            // Save campaign record
            const campaign = await this.campaignService.createCampaign({
                campaignName,
                subjectLine: subject,
                status: 'Completed',
                emailListIds: [emailListId],
                senderEmail: process.env.EMAIL_FROM || 'no-reply@yourapp.com',
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