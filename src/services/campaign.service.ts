import { CampaignDoc, CampaignType, CampaignStatus } from "../models/Campaign";
import { SenderConfig, ResendSettings, SmartSettings } from "../models/Campaign";

// DTOs
export interface CreateCampaignDto {
    user_id: string;
    campaignName: string;
    subjectLine: string;
    senderId?: string;
    campaignType?: CampaignType;
    sender?: SenderConfig;
    audience?: {
        emailLists?: string[];
        excludeLists?: string[];
        manualEmails?: string[];
    };
    content?: {
        htmlContent: string;
        plainText: string;
    };
    resendSettings?: ResendSettings;
    smartSettings?: Partial<SmartSettings>;
    schedule?: {
        scheduledDate?: Date;
        useRecipientTimezone?: boolean;
    };
    metadata?: {
        aiGenerated?: boolean;
        templateId?: string;
        tags?: string[];
    };
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

export interface CampaignAnalytics {
    deliveries: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    bounces: number;
    complaints: number;
    engagementRate: number;
    clickThroughRate: number;
    bounceRate: number;
    complaintRate: number;
}

export interface DashboardMetrics {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalDeliveries: number;
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalComplaints: number;
    averageEngagementRate: number;
    averageClickThroughRate: number;
}

export interface CampaignService {
    // Core CRUD
    createCampaign(data: CreateCampaignDto): Promise<CampaignDoc>;
    createAndScheduleCampaign(data: CreateCampaignDto, scheduledDate: Date): Promise<{ campaign: CampaignDoc; jobId: string }>;
    getCampaigns(userId: string, filters?: CampaignFilters): Promise<CampaignDoc[]>;
    getCampaignById(id: string, userId: string): Promise<CampaignDoc | null>;
    updateCampaign(id: string, userId: string, data: UpdateCampaignDto): Promise<CampaignDoc>;
    deleteCampaign(id: string, userId: string): Promise<void>;

    // Campaign Operations
    sendCampaign(id: string, userId: string): Promise<CampaignDoc>;
    scheduleCampaign(id: string, userId: string, date: Date): Promise<CampaignDoc>;
    pauseCampaign(id: string, userId: string): Promise<CampaignDoc>;
    resumeCampaign(id: string, userId: string): Promise<CampaignDoc>;
    
    // Analytics
    getCampaignAnalytics(id: string, userId: string): Promise<CampaignAnalytics>;
    getDashboardMetrics(userId: string, startDate: Date, endDate: Date): Promise<DashboardMetrics>;
    
    // Audience Management
    getAudienceSize(id: string, userId: string): Promise<number>;
    previewAudience(id: string, userId: string, limit?: number): Promise<string[]>;
    
    // Utility Functions
    validateCampaign(id: string, userId: string): Promise<{
        isValid: boolean;
        errors?: string[];
    }>;
    duplicateCampaign(id: string, userId: string, newName: string): Promise<CampaignDoc>;
    
    // Email Testing
    sendTestEmail(id: string, userId: string, testEmails: string[]): Promise<void>;
}
