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
exports.EmailGenerationController = void 0;
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
class EmailGenerationController {
    constructor(emailGenerationService) {
        this.emailGenerationService = emailGenerationService;
        this.generateEmail = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { context, tone } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            // Validation
            if (!context || typeof context !== 'string') {
                throw new ApiError_1.ApiError(400, 'Context is required and must be a string');
            }
            if (context.trim().length === 0) {
                throw new ApiError_1.ApiError(400, 'Context cannot be empty');
            }
            if (context.trim().length > 5000) {
                throw new ApiError_1.ApiError(400, 'Context is too long (max 5000 characters)');
            }
            const email = yield this.emailGenerationService.generateEmail(userId.toString(), {
                context: context.trim(),
                tone: tone || 'Professional',
            });
            // Remove recipient from response payload (we use userId for ownership)
            const toReturn = email.toObject ? email.toObject() : Object.assign({}, email);
            if (toReturn.recipient)
                delete toReturn.recipient;
            // Parse content into subject/body if stored as JSON string
            if (typeof toReturn.content === 'string') {
                try {
                    const parsed = JSON.parse(toReturn.content);
                    toReturn.subject = parsed.subject || '';
                    toReturn.body = parsed.body || '';
                }
                catch (e) {
                    console.error('Failed to parse email content:', e);
                    toReturn.body = toReturn.content;
                }
            }
            res.status(201).json(new ApiResponse_1.ApiResponse(201, toReturn, 'Email generated successfully'));
        }));
        this.regenerateEmail = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { emailId, instructions } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            // Validation
            if (!emailId || typeof emailId !== 'string') {
                throw new ApiError_1.ApiError(400, 'Email ID is required and must be a string');
            }
            if (!instructions || typeof instructions !== 'string') {
                throw new ApiError_1.ApiError(400, 'Instructions are required and must be a string');
            }
            if (instructions.trim().length === 0) {
                throw new ApiError_1.ApiError(400, 'Instructions cannot be empty');
            }
            if (instructions.trim().length > 2000) {
                throw new ApiError_1.ApiError(400, 'Instructions are too long (max 2000 characters)');
            }
            const email = yield this.emailGenerationService.regenerateEmail(userId.toString(), emailId, instructions.trim());
            // Remove recipient from response payload
            const toReturn = email.toObject ? email.toObject() : Object.assign({}, email);
            if (toReturn.recipient)
                delete toReturn.recipient;
            // Parse content into subject/body if stored as JSON string
            if (typeof toReturn.content === 'string') {
                try {
                    const parsed = JSON.parse(toReturn.content);
                    toReturn.subject = parsed.subject || '';
                    toReturn.body = parsed.body || '';
                }
                catch (e) {
                    console.error('Failed to parse regenerated email content:', e);
                    toReturn.body = toReturn.content;
                }
            }
            res.status(200).json(new ApiResponse_1.ApiResponse(200, toReturn, 'Email regenerated successfully'));
        }));
    }
}
exports.EmailGenerationController = EmailGenerationController;
