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

            const {campaignName, campaignType, subjectLine} = req.body;
            const created = await this.campaignService.createCampaign({campaignName, subjectLine, campaignType});

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
            const {campaignName, campaignType, subjectLine} = req.body
            const updated = await this.campaignService.updateCampaign(id, {
                campaignName,
                campaignType,
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
            const { campaignName, emailListId, subject, body } = req.body;
            const userId = req.user?._id;
            if (!campaignName || !emailListId || !subject || !body) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "All fields (campaignName, emailListId, subject, body) are required."
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
            // Send emails
            await this.campaignService.sendBulkEmail(emailList.emails, subject, body);
            // Save campaign record
            const campaign = await this.campaignService.createCampaign({
                campaignName,
                subjectLine: subject,
                campaignType: 'Email',
                status: 'Completed',
                userId,
                emailListId
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
}