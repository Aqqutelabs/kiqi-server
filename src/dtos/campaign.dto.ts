import { CampaignType, CampaignStatus } from "../models/Campaign";

export interface CampaignAudienceDto {
    emailLists: string[];
    excludeLists?: string[];
    manualEmails?: string[];
}

export interface CampaignContentDto {
    htmlContent: string;
    plainText: string;
}

export interface CampaignScheduleDto {
    scheduledDate?: Date;
    useRecipientTimezone?: boolean;
}

export interface CampaignMetadataDto {
    aiGenerated?: boolean;
    templateId?: string;
    tags?: string[];
}

export interface CampaignSenderDto {
    senderName: string;
    senderEmail: string;
    replyToEmail: string;
}

export interface CampaignResendDto {
    enabled: boolean;
    waitTime: number;
    condition: 'Unopened' | 'Unclicked';
}

export interface CampaignSmartSettingsDto {
    fallbacks?: {
        firstName?: string;
        lastName?: string;
        custom?: Record<string, string>;
    };
    sendLimits?: {
        dailyLimit?: number;
        batchSize?: number;
        batchInterval?: number;
    };
    compliance?: {
        includeUnsubscribe?: boolean;
        includePermissionReminder?: boolean;
        reminderText?: string;
    };
    footer?: {
        style?: string;
        customText?: string;
    };
    optimization?: {
        smartTimeEnabled?: boolean;
        predictCTR?: boolean;
    };
}

export interface CreateCampaignDto {
    user_id: string;
    campaignName: string;
    subjectLine: string;
    campaignType: CampaignType;
    sender: CampaignSenderDto;
    audience: CampaignAudienceDto;
    content: CampaignContentDto;
    resendSettings?: CampaignResendDto;
    smartSettings?: CampaignSmartSettingsDto;
    schedule?: CampaignScheduleDto;
    metadata?: CampaignMetadataDto;
    emailListIds?: string[]; // Added property
    status?: CampaignStatus; // Added property
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {
    status?: CampaignStatus;
}

export interface CampaignFilters {
    status?: CampaignStatus[];
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
    tags?: string[];
}