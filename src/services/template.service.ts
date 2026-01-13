import { EmailTemplate } from '../models/EmailTemplate';

export interface CreateTemplateDto {
    name: string;
    description: string;
    category: 'Transactional' | 'Marketing' | 'Newsletter' | 'Custom';
    subject: string;
    htmlContent: string;
    plainText: string;
    variables: {
        name: string;
        description: string;
        defaultValue?: string;
        required: boolean;
        type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    }[];
    userId: string;
    metadata?: {
        tags?: string[];
        version?: string;
        [key: string]: any;
    };
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

export interface TemplateFilters {
    category?: ('Transactional' | 'Marketing' | 'Newsletter' | 'Custom')[];
    tags?: string[];
    searchTerm?: string;
}

export interface TemplateService {
    createTemplate(data: CreateTemplateDto): Promise<EmailTemplate>;
    getTemplates(userId: string, filters?: TemplateFilters): Promise<EmailTemplate[]>;
    getTemplateById(id: string, userId: string): Promise<EmailTemplate>;
    updateTemplate(id: string, userId: string, data: UpdateTemplateDto): Promise<EmailTemplate>;
    deleteTemplate(id: string, userId: string): Promise<void>;
    renderTemplate(template: EmailTemplate, variables: Record<string, any>): Promise<{
        subject: string;
        html: string;
        text: string;
    }>;
    validateTemplateVariables(template: EmailTemplate, variables: Record<string, any>): Promise<{
        isValid: boolean;
        errors?: string[];
    }>;
}