// --- Mock Express Types ---
// Define a simplified version of Express Request, including the required req.user
export interface User {
    _id: string;
}

export interface Request {
    body: any;
    params: { [key: string]: string };
    user?: User;
}

export interface Response {
    status: (code: number) => Response;
    json: (body: any) => Response;
}

export type NextFunction = (err?: any) => void;

// --- Status Codes Utility ---
export const StatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
};

// --- Custom Error Class ---
export class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

// --- Domain Models/Interfaces ---
export interface Audience {
    emailLists?: string[];
    excludeLists?: string[];
    manualEmails?: string[];
}

export interface Campaign {
    content: any;
    _id: string;
    campaignName: string;
    subjectLine: string;
    senderId: string;
    user_id: string;
    status: 'Draft' | 'Scheduled' | 'Sent';
    audience: Audience;
    createdAt: Date;
}

export interface CampaignData {
    campaignName: string;
    subjectLine: string;
    senderId: string;
    user_id: string;
    audience: Audience;
    emailListIds?: string[];
    senderEmail?: string;
    // Optional structured content for the campaign (HTML/plain text)
    content?: {
        htmlContent?: string;
        plainText?: string;
        emailSubject?: string;
        metadata?: Record<string, any>;
    } | any;
}

export interface CampaignUpdate {
    campaignName?: string;
    subjectLine?: string;
    // Allow updating the campaign content/body
    content?: {
        htmlContent?: string;
        plainText?: string;
        emailSubject?: string;
        metadata?: Record<string, any>;
    } | any;
}

export interface EmailList {
    _id: string;
    name: string;
    user_id: string;
    emails: string[]; // Array of email addresses
}

export interface ScheduleResponse {
    campaign: Campaign;
    jobId: string;
}

export interface CampaignWithList {
    campaign: Campaign;
    emailListDetails: EmailList;
}