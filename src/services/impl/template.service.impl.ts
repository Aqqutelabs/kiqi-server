import { id } from "ethers";
import { SenderModel } from "../../models/SenderEmail";
import { TemplateModel, TemplatesModel } from "../../models/Templates";
import { TemplateService } from "../templates.service";
import { ApiError } from "../../utils/ApiError";
import { StatusCodes } from "http-status-codes";

export class TemplateServiceImpl implements TemplateService{
    async createTemplate(title: String, content: String): Promise<TemplateModel> {
        const isTemplateExists = await TemplatesModel.findById({
            id
        })
        if(isTemplateExists){
            throw new ApiError(StatusCodes.BAD_REQUEST, "Template already exists")
        }

        const template = await TemplatesModel.create({
            title: title,
            content: content
        })
        
        return template;
    }
    async getTemplates(): Promise<TemplateModel[]> {
        return TemplatesModel.find();
    }
    async getTemplateById(id: String): Promise<TemplateModel | null> {
        return TemplatesModel.findById(id)
    }
    async deleteTemplate(id: String): Promise<void> {
        await TemplatesModel.findByIdAndDelete(id)
    }
    
}