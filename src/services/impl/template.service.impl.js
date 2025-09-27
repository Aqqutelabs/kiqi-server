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
exports.TemplateServiceImpl = void 0;
const Templates_1 = require("../../models/Templates");
const ApiError_1 = require("../../utils/ApiError");
const http_status_codes_1 = require("http-status-codes");
class TemplateServiceImpl {
    createTemplate(title, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const isTemplateExists = yield Templates_1.TemplatesModel.findOne({
                content
            });
            if (isTemplateExists) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Template already exists");
            }
            const template = yield Templates_1.TemplatesModel.create({
                title: title,
                content: content
            });
            return template;
        });
    }
    getTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            return Templates_1.TemplatesModel.find();
        });
    }
    getTemplateById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Templates_1.TemplatesModel.findById(id);
        });
    }
    deleteTemplate(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Templates_1.TemplatesModel.findByIdAndDelete(id);
        });
    }
}
exports.TemplateServiceImpl = TemplateServiceImpl;
