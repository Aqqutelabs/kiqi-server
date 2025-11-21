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
            const { title, content, description, category, subject, variables } = req.body;
            const userId = (req as any).user?._id || (req as any).user?.id || req.body.userId;

            const dto = {
                name: title,
                description: description || '',
                category: category || 'Custom',
                subject: subject || title,
                htmlContent: content?.htmlContent || content || '',
                plainText: content?.plainText || '',
                variables: variables || [],
                userId: String(userId || ''),
                metadata: req.body.metadata || undefined
            };

            const template = await this.templateService.createTemplate(dto)

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
            const userId = (req as any).user?._id || (req as any).user?.id || req.query.userId || req.body.userId;
            const template = await this.templateService.getTemplateById(id, String(userId || ''));

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
            const userId = (req as any).user?._id || (req as any).user?.id || req.query.userId || req.body.userId;
            const filters = req.query || undefined;
            const templates = await this.templateService.getTemplates(String(userId || ''), filters as any);
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
            const userId = (req as any).user?._id || (req as any).user?.id || req.body.userId;
            await this.templateService.deleteTemplate(id, String(userId || ''));

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Template has been deleted",
            });
        } catch(error){
            next(error);
        }
    }
}