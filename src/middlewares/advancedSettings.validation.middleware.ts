/**
 * Middleware for validating advanced campaign settings
 */

import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError";
import { AdvancedSettingsValidator } from "../dtos/advancedCampaignSettings.dto";

/**
 * Validates advanced email settings in request body
 */
export const validateAdvancedEmailSettings = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const settings = req.body;

        // Ensure required fields exist
        if (!settings) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Advanced settings are required");
        }

        const validation = AdvancedSettingsValidator.validateAdvancedSettings(settings);

        if (!validation.valid) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Validation failed: ${validation.errors.join(", ")}`
            );
        }

        // Attach validated settings to request
        (req as any).validatedSettings = settings;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Validates batch sending parameters
 */
export const validateBatchSendingParams = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { totalRecipients, emailsPerBatch, intervalMinutes, dailyLimit } = req.body;

        const errors: string[] = [];

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
            throw new ApiError(StatusCodes.BAD_REQUEST, errors.join(", "));
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Validates resend settings specifically
 */
export const validateResendSettings = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { resendSettings } = req.body;

        if (!resendSettings) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "resendSettings are required");
        }

        const errors: string[] = [];

        // Check mutually exclusive fields
        if (resendSettings.resendToUnopened === true && resendSettings.dontResend === true) {
            errors.push("resendToUnopened and dontResend are mutually exclusive");
        }

        // If resendToUnopened is true, waitTimeDays is required
        if (resendSettings.resendToUnopened === true) {
            if (
                resendSettings.waitTimeDays === null ||
                resendSettings.waitTimeDays === undefined
            ) {
                errors.push("waitTimeDays is required when resendToUnopened is true");
            } else if (
                typeof resendSettings.waitTimeDays !== "number" ||
                resendSettings.waitTimeDays < 1
            ) {
                errors.push("waitTimeDays must be a positive number");
            }
        }

        if (errors.length > 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, errors.join(", "));
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Validates compliance settings
 */
export const validateComplianceSettings = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const { emailCompliance } = req.body;

        if (!emailCompliance) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "emailCompliance settings are required");
        }

        const errors: string[] = [];

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
            throw new ApiError(StatusCodes.BAD_REQUEST, errors.join(", "));
        }

        next();
    } catch (error) {
        next(error);
    }
};
