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
exports.SenderEmailServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const SenderEmail_1 = require("../../models/SenderEmail");
const ApiError_1 = require("../../utils/ApiError");
class SenderEmailServiceImpl {
    createSenderEmail(senderName, type, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const isUserExist = yield SenderEmail_1.SenderModel.findOne({ senderEmail: email });
            if (isUserExist) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email already exists");
            }
            const sender = yield SenderEmail_1.SenderModel.create({
                senderName,
                type: type,
                senderEmail: email,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            return sender;
        });
    }
    getSenderEmailById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return SenderEmail_1.SenderModel.findById(id);
        });
    }
    getAllSenderEmails() {
        return SenderEmail_1.SenderModel.find();
    }
    updateSenderEmail(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield SenderEmail_1.SenderModel.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true,
                updatedAt: Date.now()
            });
            if (!updated) {
                throw new Error("Sender email not found");
            }
            return updated;
        });
    }
    deleteSenderEmail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield SenderEmail_1.SenderModel.findByIdAndDelete(id);
        });
    }
}
exports.SenderEmailServiceImpl = SenderEmailServiceImpl;
