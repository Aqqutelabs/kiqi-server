import Bull from 'bull';
import { CampaignDoc } from '../models/Campaign';
import { sendEmail } from '../utils/EmailService';
import { CampaignServiceImpl } from '../services/impl/campaign.service.impl';
import { createClient } from 'redis';

interface EmailJobData {
    to: string;
    from: string;
    replyTo: string;
    subject: string;
    html: string;
    text: string;
    campaignId: string;
    metadata?: Record<string, any>;
}

// Configure Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://default:3qag3SEzV01w8iWfNes4oFkVx55mbWRp@redis-18830.c341.af-south-1-1.ec2.redns.redis-cloud.com:18830';

// Create Redis client
const client = createClient({
    username: 'default',
    password: '3qag3SEzV01w8iWfNes4oFkVx55mbWRp',
    socket: {
        host: 'redis-18830.c341.af-south-1-1.ec2.redns.redis-cloud.com',
        port: 18830
    }
});

client.on('error', (err: any) => console.log('Redis Client Error', err));

(async () => {
    await client.connect();

    // Test Redis connection
    await client.set('foo', 'bar');
    const result = await client.get('foo');
    console.log('Redis test key value:', result); // >>> bar
})();

// Create queues
const emailQueue = new Bull('email-sending', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000 // 1 second initial delay
        },
        removeOnComplete: true
    }
});

const campaignQueue = new Bull('campaign-processing', REDIS_URL);

// Rate limiting configuration
const RATE_LIMIT = {
    maxEmailsPerSecond: 10,
    maxBatchSize: 100,
    batchInterval: 1000 // 1 second
};

// Process individual emails
emailQueue.process(async (job) => {
    const { data } = job as Bull.Job<EmailJobData>;
    
    try {
        await sendEmail({
            to: data.to,
            from: data.from,
            replyTo: data.replyTo,
            subject: data.subject,
            html: data.html,
            text: data.text,
            ...data.metadata
        });

        // Update campaign analytics
        const campaignService = new CampaignServiceImpl();
        await campaignService.updateCampaignAnalytics(data.campaignId, 'deliveries', 1);

        return { success: true, email: data.to };
    } catch (error: any) {
        // Update bounce analytics if it's a permanent failure
        if (error.permanent) {
            await new CampaignServiceImpl().updateCampaignAnalytics(data.campaignId, 'bounces', 1);
        }
        throw error;
    }
});

// Process campaign batches
campaignQueue.process(async (job) => {
    const { campaign, recipientBatch } = job.data;
    const batchPromises = [];

    for (const email of recipientBatch) {
        const emailData: EmailJobData = {
            to: email,
            from: campaign.sender.senderEmail,
            replyTo: campaign.sender.replyToEmail,
            subject: campaign.content.emailSubject,
            html: campaign.content.htmlContent,
            text: campaign.content.plainText,
            campaignId: campaign._id.toString(),
            metadata: campaign.content.metadata
        };

        // Add job to email queue with rate limiting
        batchPromises.push(
            emailQueue.add(emailData, {
                priority: campaign.priority || 0,
                attempts: 3
            })
        );
    }

    await Promise.all(batchPromises);
});

// Error handling
emailQueue.on('error', (error) => {
    console.error('Email queue error:', error);
});

campaignQueue.on('error', (error) => {
    console.error('Campaign queue error:', error);
});

emailQueue.on('failed', async (job, error) => {
    console.error(`Email job failed for ${job.data.to}:`, error);
    // Update analytics for permanent failures
    if ((error as any)?.permanent) {
        await new CampaignServiceImpl().updateCampaignAnalytics(job.data.campaignId, 'bounces', 1);
    }
});

// Clean old jobs
emailQueue.on('completed', async (job) => {
    await job.remove();
});

export interface QueueService {
    addCampaign(campaign: CampaignDoc, recipients: string[]): Promise<void>;
    pauseProcessing(): Promise<void>;
    resumeProcessing(): Promise<void>;
    getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }>;
}

class EmailQueueService implements QueueService {
    async addCampaign(campaign: CampaignDoc, recipients: string[]): Promise<void> {
        const batchSize = Math.min(RATE_LIMIT.maxBatchSize, recipients.length);
        
        // Split recipients into batches
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            await campaignQueue.add(
                {
                    campaign,
                    recipientBatch: batch
                },
                {
                    priority: campaign.priority || 0,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000 // 2 second initial delay
                    }
                }
            );
        }
    }

    async pauseProcessing(): Promise<void> {
        await Promise.all([
            emailQueue.pause(),
            campaignQueue.pause()
        ]);
    }

    async resumeProcessing(): Promise<void> {
        await Promise.all([
            emailQueue.resume(),
            campaignQueue.resume()
        ]);
    }

    async getQueueStatus(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }> {
        const [emailCounts, campaignCounts] = await Promise.all([
            emailQueue.getJobCounts(),
            campaignQueue.getJobCounts()
        ]);

        return {
            waiting: emailCounts.waiting + campaignCounts.waiting,
            active: emailCounts.active + campaignCounts.active,
            completed: emailCounts.completed + campaignCounts.completed,
            failed: emailCounts.failed + campaignCounts.failed
        };
    }
}

export const queueService = new EmailQueueService();