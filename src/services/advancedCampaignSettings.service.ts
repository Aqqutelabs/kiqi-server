/**
 * Advanced Campaign Settings Service
 * Handles enforcement of advanced email campaign settings including:
 * - Recipient exclusions
 * - Resend rules
 * - Batch sending
 * - Compliance requirements
 */

import { AdvancedEmailSettingsDto, ExcludeListsDto, ResendSettingsDto } from "../dtos/advancedCampaignSettings.dto";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError";

interface CampaignRecipient {
    email: string;
    status: 'active' | 'unsubscribed' | 'bounced' | 'inactive';
    opened: boolean;
    clicked: boolean;
}

interface BatchJob {
    jobId: string;
    campaignId: string;
    totalRecipients: number;
    sentCount: number;
    currentBatchIndex: number;
    createdAt: Date;
    lastExecuted?: Date;
}

export class AdvancedCampaignSettingsService {
    private batchJobs: Map<string, BatchJob> = new Map();

    /**
     * Filters recipients based on exclusion rules
     */
    filterRecipientsByExclusions(
        recipients: CampaignRecipient[],
        excludeLists: ExcludeListsDto
    ): CampaignRecipient[] {
        return recipients.filter(recipient => {
            // Exclude unsubscribed
            if (excludeLists.unsubscribed && recipient.status === 'unsubscribed') {
                return false;
            }

            // Exclude bounced
            if (excludeLists.bounced && recipient.status === 'bounced') {
                return false;
            }

            // Exclude inactive
            if (excludeLists.inactive && recipient.status === 'inactive') {
                return false;
            }

            return true;
        });
    }

    /**
     * Applies resend logic to determine which recipients should receive the email
     */
    applyResendRules(
        recipients: CampaignRecipient[],
        resendSettings: ResendSettingsDto,
        isPreviousSend: boolean = false
    ): CampaignRecipient[] {
        // First send - all recipients included
        if (!isPreviousSend) {
            return recipients;
        }

        // If dontResend is true, exclude all previously sent recipients
        if (resendSettings.dontResend) {
            return [];
        }

        // If resendToUnopened is true, only include unopened emails
        if (resendSettings.resendToUnopened) {
            return recipients.filter(r => !r.opened);
        }

        return recipients;
    }

    /**
     * Splits recipients into batches for rate-limited sending
     */
    createBatches(
        recipients: CampaignRecipient[],
        emailsPerBatch: number
    ): CampaignRecipient[][] {
        const batches: CampaignRecipient[][] = [];
        for (let i = 0; i < recipients.length; i += emailsPerBatch) {
            batches.push(recipients.slice(i, i + emailsPerBatch));
        }
        return batches;
    }

    /**
     * Calculates the next batch execution time based on interval
     */
    calculateNextBatchTime(currentIndex: number, intervalMinutes: number): Date {
        const nextTime = new Date();
        nextTime.setMinutes(nextTime.getMinutes() + (currentIndex * intervalMinutes));
        return nextTime;
    }

    /**
     * Checks if batch sending is within daily limits
     */
    validateDailyLimit(
        sentToday: number,
        currentBatchSize: number,
        dailyLimit: number
    ): { valid: boolean; remainingCapacity: number } {
        const totalAfterBatch = sentToday + currentBatchSize;
        const valid = totalAfterBatch <= dailyLimit;
        const remainingCapacity = Math.max(0, dailyLimit - sentToday);

        return { valid, remainingCapacity };
    }

    /**
     * Deduplicates recipients (ensures sendOncePerContact)
     */
    deduplicateRecipients(recipients: CampaignRecipient[]): CampaignRecipient[] {
        const seen = new Set<string>();
        const deduplicated: CampaignRecipient[] = [];

        for (const recipient of recipients) {
            const emailLower = recipient.email.toLowerCase();
            if (!seen.has(emailLower)) {
                seen.add(emailLower);
                deduplicated.push(recipient);
            }
        }

        return deduplicated;
    }

    /**
     * Applies personalization fallbacks or uses alternative text
     */
    applyFallbackText(
        content: string,
        fallbackText: string,
        personalizationFailed: boolean,
        useIfPersonalizationFails: boolean
    ): string {
        // If personalization failed and fallback is configured
        if (personalizationFailed && useIfPersonalizationFails) {
            return fallbackText || content;
        }
        return content;
    }

    /**
     * Adds compliance elements to email content
     */
    addComplianceElements(
        htmlContent: string,
        includeUnsubscribeLink: boolean,
        includePermissionReminder: boolean,
        permissionReminderText: string,
        unsubscribeUrl?: string
    ): string {
        let content = htmlContent;

        if (includePermissionReminder) {
            const reminderHtml = `
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    ${permissionReminderText}
                </p>
            `;
            content += reminderHtml;
        }

        if (includeUnsubscribeLink && unsubscribeUrl) {
            const unsubscribeHtml = `
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    <a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: none;">
                        Unsubscribe from this email list
                    </a>
                </p>
            `;
            content += unsubscribeHtml;
        }

        return content;
    }

    /**
     * Creates a batch job for tracking campaign sending progress
     */
    createBatchJob(
        campaignId: string,
        totalRecipients: number,
        emailsPerBatch: number
    ): BatchJob {
        const jobId = `batch-${campaignId}-${Date.now()}`;
        const job: BatchJob = {
            jobId,
            campaignId,
            totalRecipients,
            sentCount: 0,
            currentBatchIndex: 0,
            createdAt: new Date()
        };

        this.batchJobs.set(jobId, job);
        return job;
    }

    /**
     * Gets batch job status
     */
    getBatchJobStatus(jobId: string): BatchJob | null {
        return this.batchJobs.get(jobId) || null;
    }

    /**
     * Updates batch job progress
     */
    updateBatchJobProgress(jobId: string, sentCount: number, currentBatchIndex: number): void {
        const job = this.batchJobs.get(jobId);
        if (job) {
            job.sentCount = sentCount;
            job.currentBatchIndex = currentBatchIndex;
            job.lastExecuted = new Date();
        }
    }

    /**
     * Completes a batch job
     */
    completeBatchJob(jobId: string): void {
        this.batchJobs.delete(jobId);
    }

    /**
     * Calculates sending schedule for batches
     * @returns Array of batch execution times
     */
    calculateBatchSchedule(
        recipientCount: number,
        emailsPerBatch: number,
        intervalMinutes: number
    ): Date[] {
        const batchCount = Math.ceil(recipientCount / emailsPerBatch);
        const schedule: Date[] = [];

        for (let i = 0; i < batchCount; i++) {
            const batchTime = new Date();
            batchTime.setMinutes(batchTime.getMinutes() + (i * intervalMinutes));
            schedule.push(batchTime);
        }

        return schedule;
    }

    /**
     * Validates batch sending won't exceed rate limits
     */
    validateBatchSendingFeasibility(
        totalRecipients: number,
        emailsPerBatch: number,
        intervalMinutes: number,
        dailyLimit: number
    ): { feasible: boolean; estimatedTime: number; issues: string[] } {
        const issues: string[] = [];
        const batchCount = Math.ceil(totalRecipients / emailsPerBatch);
        const estimatedTimeMinutes = (batchCount - 1) * intervalMinutes;

        // Check if daily limit is exceeded
        if (totalRecipients > dailyLimit) {
            issues.push(`Total recipients (${totalRecipients}) exceed daily limit (${dailyLimit})`);
        }

        // Warn if it takes more than 24 hours
        const minutesInDay = 24 * 60;
        if (estimatedTimeMinutes > minutesInDay) {
            issues.push(`Estimated sending time (${estimatedTimeMinutes} minutes) exceeds 24 hours`);
        }

        return {
            feasible: issues.length === 0,
            estimatedTime: estimatedTimeMinutes,
            issues
        };
    }

    /**
     * Prepares recipient list for sending based on all settings
     */
    prepareRecipientsForSending(
        recipients: CampaignRecipient[],
        settings: AdvancedEmailSettingsDto,
        isPreviousSend: boolean = false
    ): {
        finalRecipients: CampaignRecipient[];
        filteredCount: number;
        deduplicatedCount: number;
    } {
        let finalRecipients = [...recipients];
        let originalCount = finalRecipients.length;

        // Step 1: Apply exclusion filters
        finalRecipients = this.filterRecipientsByExclusions(
            finalRecipients,
            settings.excludeLists
        );
        const afterExclusion = finalRecipients.length;

        // Step 2: Apply resend rules
        finalRecipients = this.applyResendRules(
            finalRecipients,
            settings.resendSettings,
            isPreviousSend
        );

        // Step 3: Deduplicate (if configured)
        if (settings.fallbacks.sendOncePerContact) {
            finalRecipients = this.deduplicateRecipients(finalRecipients);
        }
        const afterDedup = finalRecipients.length;

        return {
            finalRecipients,
            filteredCount: originalCount - afterExclusion,
            deduplicatedCount: afterExclusion - afterDedup
        };
    }
}
