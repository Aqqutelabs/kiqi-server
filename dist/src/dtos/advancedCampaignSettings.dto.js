"use strict";
/**
 * Advanced Email Campaign Settings DTOs
 * Defines the schema and validation rules for advanced campaign configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSettingsDefaults = exports.AdvancedSettingsValidator = void 0;
/**
 * Validation class for Advanced Email Settings
 */
class AdvancedSettingsValidator {
    /**
     * Validates the complete advanced settings object
     */
    static validateAdvancedSettings(settings) {
        const errors = [];
        // Validate exclude lists
        if (!this.isValidExcludeLists(settings.excludeLists)) {
            errors.push("Invalid excludeLists format");
        }
        // Validate recipient email address
        if (settings.recipientEmailAddress && typeof settings.recipientEmailAddress !== 'string') {
            errors.push("recipientEmailAddress must be a string");
        }
        // Validate resend settings
        const resendErrors = this.validateResendSettings(settings.resendSettings);
        errors.push(...resendErrors);
        // Validate fallbacks
        if (!this.isValidFallbacks(settings.fallbacks)) {
            errors.push("Invalid fallbacks format");
        }
        // Validate daily send limit
        if (typeof settings.dailySendLimit !== 'number' || settings.dailySendLimit < 1) {
            errors.push("dailySendLimit must be a positive number");
        }
        // Validate batch sending
        const batchErrors = this.validateBatchSending(settings.batchSending);
        errors.push(...batchErrors);
        // Validate email compliance
        if (!this.isValidEmailCompliance(settings.emailCompliance)) {
            errors.push("Invalid emailCompliance format");
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Validates resend settings with strict business rules
     */
    static validateResendSettings(settings) {
        const errors = [];
        // Check mutually exclusive fields
        if (settings.resendToUnopened === true && settings.dontResend === true) {
            errors.push("resendToUnopened and dontResend are mutually exclusive");
        }
        // If resendToUnopened is true, waitTimeDays is required and must be positive
        if (settings.resendToUnopened === true) {
            if (settings.waitTimeDays === null || settings.waitTimeDays === undefined) {
                errors.push("waitTimeDays is required when resendToUnopened is true");
            }
            else if (typeof settings.waitTimeDays !== 'number' || settings.waitTimeDays < 1) {
                errors.push("waitTimeDays must be a positive number when resendToUnopened is true");
            }
        }
        // If dontResend is true, waitTimeDays should be null
        if (settings.dontResend === true && settings.waitTimeDays !== null) {
            errors.push("waitTimeDays should be null when dontResend is true");
        }
        return errors;
    }
    /**
     * Validates batch sending configuration
     */
    static validateBatchSending(settings) {
        const errors = [];
        if (typeof settings.emailsPerBatch !== 'number' || settings.emailsPerBatch < 1) {
            errors.push("emailsPerBatch must be a positive number");
        }
        if (typeof settings.intervalMinutes !== 'number' || settings.intervalMinutes < 1) {
            errors.push("intervalMinutes must be a positive number");
        }
        return errors;
    }
    static isValidExcludeLists(excludeLists) {
        return (typeof excludeLists.unsubscribed === 'boolean' &&
            typeof excludeLists.bounced === 'boolean' &&
            typeof excludeLists.inactive === 'boolean');
    }
    static isValidFallbacks(fallbacks) {
        return (typeof fallbacks.alternativeText === 'string' &&
            typeof fallbacks.useIfPersonalizationFails === 'boolean' &&
            typeof fallbacks.sendOncePerContact === 'boolean');
    }
    static isValidEmailCompliance(compliance) {
        return (typeof compliance.includeUnsubscribeLink === 'boolean' &&
            typeof compliance.includePermissionReminder === 'boolean' &&
            typeof compliance.permissionReminderText === 'string');
    }
}
exports.AdvancedSettingsValidator = AdvancedSettingsValidator;
/**
 * Default advanced settings factory
 */
class AdvancedSettingsDefaults {
    static getDefaults() {
        return {
            excludeLists: {
                unsubscribed: true,
                bounced: true,
                inactive: false
            },
            recipientEmailAddress: "",
            resendSettings: {
                resendToUnopened: false,
                dontResend: true,
                waitTimeDays: null
            },
            fallbacks: {
                alternativeText: "",
                useIfPersonalizationFails: false,
                sendOncePerContact: true
            },
            dailySendLimit: 5000,
            batchSending: {
                emailsPerBatch: 500,
                intervalMinutes: 10
            },
            emailCompliance: {
                includeUnsubscribeLink: true,
                includePermissionReminder: true,
                permissionReminderText: "You are receiving this email because you signed up for our newsletter."
            }
        };
    }
    /**
     * Merges user settings with defaults
     */
    static mergeWithDefaults(userSettings) {
        var _a, _b;
        const defaults = this.getDefaults();
        return {
            excludeLists: Object.assign(Object.assign({}, defaults.excludeLists), (userSettings.excludeLists || {})),
            recipientEmailAddress: (_a = userSettings.recipientEmailAddress) !== null && _a !== void 0 ? _a : defaults.recipientEmailAddress,
            resendSettings: Object.assign(Object.assign({}, defaults.resendSettings), (userSettings.resendSettings || {})),
            fallbacks: Object.assign(Object.assign({}, defaults.fallbacks), (userSettings.fallbacks || {})),
            dailySendLimit: (_b = userSettings.dailySendLimit) !== null && _b !== void 0 ? _b : defaults.dailySendLimit,
            batchSending: Object.assign(Object.assign({}, defaults.batchSending), (userSettings.batchSending || {})),
            emailCompliance: Object.assign(Object.assign({}, defaults.emailCompliance), (userSettings.emailCompliance || {}))
        };
    }
}
exports.AdvancedSettingsDefaults = AdvancedSettingsDefaults;
