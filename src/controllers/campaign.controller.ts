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
}