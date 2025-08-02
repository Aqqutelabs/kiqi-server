import { TemplateModel } from "../models/Templates";

export interface TemplateService{
    createTemplate( title: String, content: String): Promise<TemplateModel>
    getTemplates(): Promise<TemplateModel[]>
    getTemplateById(id: String): Promise<TemplateModel | null>
    deleteTemplate(id: String): Promise<void>
}