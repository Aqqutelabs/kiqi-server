import { Response, Request, NextFunction } from "express";
import { TemplateServiceImpl } from "../services/impl/template.service.impl";
import { StatusCodes } from "http-status-codes";
import { error } from "console";

export class TemplatesController {
    private templateService: TemplateServiceImpl

    constructor(){
        this.templateService = new TemplateServiceImpl();
    }

    public createTemplate = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const { title, content } = req.body;
            const template = await this.templateService.createTemplate(title, content)

            res.status(StatusCodes.CREATED).json({
                error: false,
                message: "Template has been created",
                data: template
            });
        } catch(error){
            next(error);
        }
    }

    public getTemplateById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id;
            const template = await this.templateService.getTemplateById(id);

            if(!template){
                res.status(StatusCodes.NOT_FOUND).json({
                    error: true,
                    message: "Template not found",
                })
            }

            res.status(StatusCodes.OK).json({
                error: false,
                data: template
            })
        } catch(error){
            next(error);
        }
    }

    public getAllTemplates = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const templates = await this.templateService.getTemplates();
            res.status(StatusCodes.OK).json({
                error: false,
                data: templates,
            });
        } catch(error){
            next(error);
        }
    }

    public deleteTemplates = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const id = req.params.id;
            await this.templateService.deleteTemplate(id);

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Template has been deleted",
            });
        } catch(error){
            next(error);
        }
    }
}