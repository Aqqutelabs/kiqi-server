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
exports.settingsController = void 0;
const Settings_1 = __importDefault(require("../models/Settings"));
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const authHandler = (handler) => (0, AsyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const anyReq = req;
    if (!anyReq.user || !anyReq.user._id)
        throw new ApiError_1.ApiError(401, 'User not authenticated');
    return handler(anyReq, res, next);
}));
class SettingsController {
    constructor() {
        // Get settings for current user or defaults
        this.getSettings = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user._id;
            let settings = yield Settings_1.default.findOne({ user_id: userId }).lean().exec();
            if (!settings) {
                // return default values without persisting
                settings = {
                    user_id: userId,
                    altText: '',
                    dailySendLimit: 1000,
                    batchSendingTime: '09:00',
                    emailCompliance: {
                        includeSubscribedLink: true,
                        includePermissionReminder: true
                    }
                };
            }
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, settings, 'Settings retrieved'));
        }));
        // Update or create settings
        this.upsertSettings = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.user._id;
            const { altText, dailySendLimit, batchSendingTime, emailCompliance } = req.body;
            const update = {};
            if (typeof altText === 'string')
                update.altText = altText;
            if (typeof dailySendLimit === 'number')
                update.dailySendLimit = dailySendLimit;
            if (typeof batchSendingTime === 'string')
                update.batchSendingTime = batchSendingTime;
            if (emailCompliance && typeof emailCompliance === 'object')
                update.emailCompliance = {
                    includeSubscribedLink: !!emailCompliance.includeSubscribedLink,
                    includePermissionReminder: !!emailCompliance.includePermissionReminder
                };
            const settings = yield Settings_1.default.findOneAndUpdate({ user_id: userId }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, settings, 'Settings saved'));
        }));
    }
}
exports.settingsController = new SettingsController();
exports.default = SettingsController;
