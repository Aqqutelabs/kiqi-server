import { StatusCodes } from 'http-status-codes';
import Handlebars from 'handlebars';
import { EmailTemplate, EmailTemplateModel } from '../../models/EmailTemplate';
import { ApiError } from '../../utils/ApiError';
import { TemplateService, CreateTemplateDto, UpdateTemplateDto, TemplateFilters } from '../template.service';

export class TemplateServiceImpl implements TemplateService {
    private validateAccess(template: EmailTemplate, userId: string): void {
        if (template.userId.toString() !== userId) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have access to this template"
            );
        }
    }

    async createTemplate(data: CreateTemplateDto): Promise<EmailTemplate> {
        // Check for existing template with same name for this user
        const existingTemplate = await EmailTemplateModel.findOne({
            name: data.name,
            userId: data.userId
        });

        if (existingTemplate) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                "A template with this name already exists"
            );
        }

        // Validate template syntax
        try {
            Handlebars.compile(data.htmlContent);
            Handlebars.compile(data.plainText);
            Handlebars.compile(data.subject);
        } catch (error) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Invalid template syntax: ${(error as Error).message}`
            );
        }

        // Create template
        const template = await EmailTemplateModel.create(data);
        return template;
    }

    async getTemplates(userId: string, filters?: TemplateFilters): Promise<EmailTemplate[]> {
        const query: any = { userId };

        // Apply filters
        if (filters) {
            if (filters.category?.length) {
                query.category = { $in: filters.category };
            }

            if (filters.tags?.length) {
                query['metadata.tags'] = { $in: filters.tags };
            }

            if (filters.searchTerm) {
                query.$text = { $search: filters.searchTerm };
            }
        }

        return EmailTemplateModel.find(query).sort({ createdAt: -1 });
    }

    async getTemplateById(id: string, userId: string): Promise<EmailTemplate> {
        const template = await EmailTemplateModel.findById(id);

        if (!template) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Template not found");
        }

        this.validateAccess(template, userId);
        return template;
    }

    async updateTemplate(id: string, userId: string, data: UpdateTemplateDto): Promise<EmailTemplate> {
        const template = await this.getTemplateById(id, userId);

        // If updating content, validate template syntax
        if (data.htmlContent || data.plainText || data.subject) {
            try {
                if (data.htmlContent) Handlebars.compile(data.htmlContent);
                if (data.plainText) Handlebars.compile(data.plainText);
                if (data.subject) Handlebars.compile(data.subject);
            } catch (error) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Invalid template syntax: ${(error as Error).message}`
                );
            }
        }

        // Update template
        const updated = await EmailTemplateModel.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updated) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Template not found");
        }

        return updated;
    }

    async deleteTemplate(id: string, userId: string): Promise<void> {
        const template = await this.getTemplateById(id, userId);
        await EmailTemplateModel.findByIdAndDelete(id);
    }

    async renderTemplate(
        template: EmailTemplate,
        variables: Record<string, any>
    ): Promise<{ subject: string; html: string; text: string }> {
        // Validate variables first
        const validation = await this.validateTemplateVariables(template, variables);
        if (!validation.isValid) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Invalid template variables: ${validation.errors?.join(', ')}`
            );
        }

        try {
            // Register custom helpers
            this.registerHandlebarsHelpers();

            // Compile and render each part
            const subjectTemplate = Handlebars.compile(template.subject);
            const htmlTemplate = Handlebars.compile(template.htmlContent);
            const textTemplate = Handlebars.compile(template.plainText);

            return {
                subject: subjectTemplate(variables),
                html: htmlTemplate(variables),
                text: textTemplate(variables)
            };
        } catch (error) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Failed to render template: ${(error as Error).message}`
            );
        }
    }

    async validateTemplateVariables(
        template: EmailTemplate,
        variables: Record<string, any>
    ): Promise<{ isValid: boolean; errors?: string[] }> {
        const errors: string[] = [];

        // Check required variables
        for (const variable of template.variables) {
            if (variable.required && !(variable.name in variables)) {
                errors.push(`Missing required variable: ${variable.name}`);
                continue;
            }

            if (variable.name in variables) {
                const value = variables[variable.name];
                
                // Type validation
                switch (variable.type) {
                    case 'string':
                        if (typeof value !== 'string') {
                            errors.push(`${variable.name} must be a string`);
                        }
                        break;
                    case 'number':
                        if (typeof value !== 'number') {
                            errors.push(`${variable.name} must be a number`);
                        }
                        break;
                    case 'boolean':
                        if (typeof value !== 'boolean') {
                            errors.push(`${variable.name} must be a boolean`);
                        }
                        break;
                    case 'date':
                        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
                            errors.push(`${variable.name} must be a valid date`);
                        }
                        break;
                    case 'array':
                        if (!Array.isArray(value)) {
                            errors.push(`${variable.name} must be an array`);
                        }
                        break;
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    private registerHandlebarsHelpers(): void {
        // Date formatting
        Handlebars.registerHelper('formatDate', function(date: Date, format: string) {
            return new Date(date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        });

        // Currency formatting
        Handlebars.registerHelper('formatCurrency', function(amount: number) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        });

        // Conditional helpers
        Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });

        // Array helpers
        Handlebars.registerHelper('join', function(arr: any[], separator: string) {
            return arr.join(separator);
        });

        // String helpers
        Handlebars.registerHelper('uppercase', function(str: string) {
            return str.toUpperCase();
        });

        Handlebars.registerHelper('lowercase', function(str: string) {
            return str.toLowerCase();
        });
    }
}