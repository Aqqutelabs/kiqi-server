"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const handlebars_1 = __importDefault(require("handlebars"));
const EmailTemplate_1 = require("../../models/EmailTemplate");
const ApiError_1 = require("../../utils/ApiError");
class TemplateServiceImpl {
    validateAccess(template, userId) {
        if (template.userId.toString() !== userId) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have access to this template");
        }
    }
    createTemplate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check for existing template with same name for this user
            const existingTemplate = yield EmailTemplate_1.EmailTemplateModel.findOne({
                name: data.name,
                userId: data.userId
            });
            if (existingTemplate) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.CONFLICT, "A template with this name already exists");
            }
            // Validate template syntax
            try {
                handlebars_1.default.compile(data.htmlContent);
                handlebars_1.default.compile(data.plainText);
                handlebars_1.default.compile(data.subject);
            }
            catch (error) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid template syntax: ${error.message}`);
            }
            // Create template
            const template = yield EmailTemplate_1.EmailTemplateModel.create(data);
            return template;
        });
    }
    getTemplates(userId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const query = { userId };
            // Apply filters
            if (filters) {
                if ((_a = filters.category) === null || _a === void 0 ? void 0 : _a.length) {
                    query.category = { $in: filters.category };
                }
                if ((_b = filters.tags) === null || _b === void 0 ? void 0 : _b.length) {
                    query['metadata.tags'] = { $in: filters.tags };
                }
                if (filters.searchTerm) {
                    query.$text = { $search: filters.searchTerm };
                }
            }
            return EmailTemplate_1.EmailTemplateModel.find(query).sort({ createdAt: -1 });
        });
    }
    getTemplateById(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield EmailTemplate_1.EmailTemplateModel.findById(id);
            if (!template) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Template not found");
            }
            this.validateAccess(template, userId);
            return template;
        });
    }
    updateTemplate(id, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.getTemplateById(id, userId);
            // If updating content, validate template syntax
            if (data.htmlContent || data.plainText || data.subject) {
                try {
                    if (data.htmlContent)
                        handlebars_1.default.compile(data.htmlContent);
                    if (data.plainText)
                        handlebars_1.default.compile(data.plainText);
                    if (data.subject)
                        handlebars_1.default.compile(data.subject);
                }
                catch (error) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid template syntax: ${error.message}`);
                }
            }
            // Update template
            const updated = yield EmailTemplate_1.EmailTemplateModel.findByIdAndUpdate(id, Object.assign(Object.assign({}, data), { updatedAt: new Date() }), { new: true, runValidators: true });
            if (!updated) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Template not found");
            }
            return updated;
        });
    }
    deleteTemplate(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.getTemplateById(id, userId);
            yield EmailTemplate_1.EmailTemplateModel.findByIdAndDelete(id);
        });
    }
    renderTemplate(template, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Validate variables first
            const validation = yield this.validateTemplateVariables(template, variables);
            if (!validation.isValid) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid template variables: ${(_a = validation.errors) === null || _a === void 0 ? void 0 : _a.join(', ')}`);
            }
            try {
                // Register custom helpers
                this.registerHandlebarsHelpers();
                // Compile and render each part
                const subjectTemplate = handlebars_1.default.compile(template.subject);
                const htmlTemplate = handlebars_1.default.compile(template.htmlContent);
                const textTemplate = handlebars_1.default.compile(template.plainText);
                return {
                    subject: subjectTemplate(variables),
                    html: htmlTemplate(variables),
                    text: textTemplate(variables)
                };
            }
            catch (error) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to render template: ${error.message}`);
            }
        });
    }
    validateTemplateVariables(template, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = [];
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
        });
    }
    registerHandlebarsHelpers() {
        // Date formatting
        handlebars_1.default.registerHelper('formatDate', function (date, format) {
            return new Date(date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        });
        // Currency formatting
        handlebars_1.default.registerHelper('formatCurrency', function (amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        });
        // Conditional helpers
        handlebars_1.default.registerHelper('ifEquals', function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });
        // Array helpers
        handlebars_1.default.registerHelper('join', function (arr, separator) {
            return arr.join(separator);
        });
        // String helpers
        handlebars_1.default.registerHelper('uppercase', function (str) {
            return str.toUpperCase();
        });
        handlebars_1.default.registerHelper('lowercase', function (str) {
            return str.toLowerCase();
        });
    }
}
exports.TemplateServiceImpl = TemplateServiceImpl;
