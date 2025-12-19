/**
 * Advanced Email Campaign Settings DTOs
 * Defines the schema and validation rules for advanced campaign configurations
 */

export interface ExcludeListsDto {
    unsubscribed: boolean;
    bounced: boolean;
    inactive: boolean;
}

export interface ResendSettingsDto {
    resendToUnopened: boolean;
    dontResend: boolean;
    waitTimeDays: number | null;
}

export interface FallbacksDto {
    alternativeText: string;
    useIfPersonalizationFails: boolean;
    sendOncePerContact: boolean;
}

export interface BatchSendingDto {
    emailsPerBatch: number;
    intervalMinutes: number;
}

export interface EmailComplianceDto {
    includeUnsubscribeLink: boolean;
    includePermissionReminder: boolean;
    permissionReminderText: string;
}

export interface AdvancedEmailSettingsDto {
    excludeLists: ExcludeListsDto;
    recipientEmailAddress: string;
    resendSettings: ResendSettingsDto;
    fallbacks: FallbacksDto;
    dailySendLimit: number;
    batchSending: BatchSendingDto;
    emailCompliance: EmailComplianceDto;
}

/**
 * Validation class for Advanced Email Settings
 */
export class AdvancedSettingsValidator {
    /**
     * Validates the complete advanced settings object
     */
    static validateAdvancedSettings(settings: AdvancedEmailSettingsDto): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

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
    private static validateResendSettings(settings: ResendSettingsDto): string[] {
        const errors: string[] = [];

        // Check mutually exclusive fields
        if (settings.resendToUnopened === true && settings.dontResend === true) {
            errors.push("resendToUnopened and dontResend are mutually exclusive");
        }

        // If resendToUnopened is true, waitTimeDays is required and must be positive
        if (settings.resendToUnopened === true) {
            if (settings.waitTimeDays === null || settings.waitTimeDays === undefined) {
                errors.push("waitTimeDays is required when resendToUnopened is true");
            } else if (typeof settings.waitTimeDays !== 'number' || settings.waitTimeDays < 1) {
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
    private static validateBatchSending(settings: BatchSendingDto): string[] {
        const errors: string[] = [];

        if (typeof settings.emailsPerBatch !== 'number' || settings.emailsPerBatch < 1) {
            errors.push("emailsPerBatch must be a positive number");
        }

        if (typeof settings.intervalMinutes !== 'number' || settings.intervalMinutes < 1) {
            errors.push("intervalMinutes must be a positive number");
        }

        return errors;
    }

    private static isValidExcludeLists(excludeLists: ExcludeListsDto): boolean {
        return (
            typeof excludeLists.unsubscribed === 'boolean' &&
            typeof excludeLists.bounced === 'boolean' &&
            typeof excludeLists.inactive === 'boolean'
        );
    }

    private static isValidFallbacks(fallbacks: FallbacksDto): boolean {
        return (
            typeof fallbacks.alternativeText === 'string' &&
            typeof fallbacks.useIfPersonalizationFails === 'boolean' &&
            typeof fallbacks.sendOncePerContact === 'boolean'
        );
    }

    private static isValidEmailCompliance(compliance: EmailComplianceDto): boolean {
        return (
            typeof compliance.includeUnsubscribeLink === 'boolean' &&
            typeof compliance.includePermissionReminder === 'boolean' &&
            typeof compliance.permissionReminderText === 'string'
        );
    }
}

/**
 * Default advanced settings factory
 */
export class AdvancedSettingsDefaults {
    static getDefaults(): AdvancedEmailSettingsDto {
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
    static mergeWithDefaults(userSettings: Partial<AdvancedEmailSettingsDto>): AdvancedEmailSettingsDto {
        const defaults = this.getDefaults();
        return {
            excludeLists: { ...defaults.excludeLists, ...(userSettings.excludeLists || {}) },
            recipientEmailAddress: userSettings.recipientEmailAddress ?? defaults.recipientEmailAddress,
            resendSettings: { ...defaults.resendSettings, ...(userSettings.resendSettings || {}) },
            fallbacks: { ...defaults.fallbacks, ...(userSettings.fallbacks || {}) },
            dailySendLimit: userSettings.dailySendLimit ?? defaults.dailySendLimit,
            batchSending: { ...defaults.batchSending, ...(userSettings.batchSending || {}) },
            emailCompliance: { ...defaults.emailCompliance, ...(userSettings.emailCompliance || {}) }
        };
    }
}
