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
            const { context, tone, continueThread } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(401, 'User not authenticated');
            }
            if (!context) {
                throw new ApiError_1.ApiError(400, 'Missing required field: context');
            }
            const email = yield this.emailGenerationService.generateEmail(userId.toString(), {
                context,
                tone: tone || 'Professional',
                continueThread: !!continueThread,
            });
            // Remove recipient from response payload (we use userId for ownership)
            const toReturn = email.toObject ? email.toObject() : Object.assign({}, email);
            if (toReturn.recipient)
                delete toReturn.recipient;
            // If content is stored as JSON string, parse it into subject/body
            try {
                if (typeof toReturn.content === 'string') {
                    const parsed = JSON.parse(toReturn.content);
                    toReturn.subject = parsed.subject;
                    toReturn.body = parsed.body;
                }
            }
            catch (e) {
                // ignore parsing error and leave raw content
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
            if (!emailId || !instructions) {
                throw new ApiError_1.ApiError(400, 'Missing required fields');
            }
            const email = yield this.emailGenerationService.regenerateEmail(userId.toString(), emailId, instructions);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, email, 'Email regenerated successfully'));
        }));
    }
}
exports.EmailGenerationController = EmailGenerationController;
