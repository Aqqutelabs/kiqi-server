"use strict";
/**
 * Middleware for validating advanced campaign settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateComplianceSettings = exports.validateResendSettings = exports.validateBatchSendingParams = exports.validateAdvancedEmailSettings = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = require("../utils/ApiError");
const advancedCampaignSettings_dto_1 = require("../dtos/advancedCampaignSettings.dto");
/**
 * Validates advanced email settings in request body
 */
const validateAdvancedEmailSettings = (req, res, next) => {
    try {
        const settings = req.body;
        // Ensure required fields exist
        if (!settings) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Advanced settings are required");
        }
        const validation = advancedCampaignSettings_dto_1.AdvancedSettingsValidator.validateAdvancedSettings(settings);
        if (!validation.valid) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Validation failed: ${validation.errors.join(", ")}`);
        }
        // Attach validated settings to request
        req.validatedSettings = settings;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateAdvancedEmailSettings = validateAdvancedEmailSettings;
/**
 * Validates batch sending parameters
 */
const validateBatchSendingParams = (req, res, next) => {
    try {
        const { totalRecipients, emailsPerBatch, intervalMinutes, dailyLimit } = req.body;
        const errors = [];
        if (totalRecipients && (typeof totalRecipients !== "number" || totalRecipients < 1)) {
            errors.push("totalRecipients must be a positive number");
        }
        if (emailsPerBatch && (typeof emailsPerBatch !== "number" || emailsPerBatch < 1)) {
            errors.push("emailsPerBatch must be a positive number");
        }
        if (intervalMinutes && (typeof intervalMinutes !== "number" || intervalMinutes < 1)) {
            errors.push("intervalMinutes must be a positive number");
        }
        if (dailyLimit && (typeof dailyLimit !== "number" || dailyLimit < 1)) {
            errors.push("dailyLimit must be a positive number");
        }
        if (errors.length > 0) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, errors.join(", "));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateBatchSendingParams = validateBatchSendingParams;
/**
 * Validates resend settings specifically
 */
const validateResendSettings = (req, res, next) => {
    try {
        const { resendSettings } = req.body;
        if (!resendSettings) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "resendSettings are required");
        }
        const errors = [];
        // Check mutually exclusive fields
        if (resendSettings.resendToUnopened === true && resendSettings.dontResend === true) {
            errors.push("resendToUnopened and dontResend are mutually exclusive");
        }
        // If resendToUnopened is true, waitTimeDays is required
        if (resendSettings.resendToUnopened === true) {
            if (resendSettings.waitTimeDays === null ||
                resendSettings.waitTimeDays === undefined) {
                errors.push("waitTimeDays is required when resendToUnopened is true");
            }
            else if (typeof resendSettings.waitTimeDays !== "number" ||
                resendSettings.waitTimeDays < 1) {
                errors.push("waitTimeDays must be a positive number");
            }
        }
        if (errors.length > 0) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, errors.join(", "));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateResendSettings = validateResendSettings;
/**
 * Validates compliance settings
 */
const validateComplianceSettings = (req, res, next) => {
    try {
        const { emailCompliance } = req.body;
        if (!emailCompliance) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "emailCompliance settings are required");
        }
        const errors = [];
        if (typeof emailCompliance.includeUnsubscribeLink !== "boolean") {
            errors.push("includeUnsubscribeLink must be a boolean");
        }
        if (typeof emailCompliance.includePermissionReminder !== "boolean") {
            errors.push("includePermissionReminder must be a boolean");
        }
        if (typeof emailCompliance.permissionReminderText !== "string") {
            errors.push("permissionReminderText must be a string");
        }
        if (emailCompliance.permissionReminderText.length > 1000) {
            errors.push("permissionReminderText cannot exceed 1000 characters");
        }
        if (errors.length > 0) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, errors.join(", "));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateComplianceSettings = validateComplianceSettings;
