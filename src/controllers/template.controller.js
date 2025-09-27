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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesController = void 0;
const template_service_impl_1 = require("../services/impl/template.service.impl");
const http_status_codes_1 = require("http-status-codes");
class TemplatesController {
    constructor() {
        this.createTemplate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, content } = req.body;
                const template = yield this.templateService.createTemplate(title, content);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: "Template has been created",
                    data: template
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getTemplateById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const template = yield this.templateService.getTemplateById(id);
                if (!template) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Template not found",
                    });
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: template
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllTemplates = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const templates = yield this.templateService.getTemplates();
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: templates,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deleteTemplates = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                yield this.templateService.deleteTemplate(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Template has been deleted",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.templateService = new template_service_impl_1.TemplateServiceImpl();
    }
}
exports.TemplatesController = TemplatesController;
