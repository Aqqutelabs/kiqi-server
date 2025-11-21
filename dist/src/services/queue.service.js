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
exports.queueService = void 0;
const bull_1 = __importDefault(require("bull"));
const EmailService_1 = require("../utils/EmailService");
const campaign_service_impl_1 = require("../services/impl/campaign.service.impl");
const redis_1 = require("redis");
// Configure Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://default:3qag3SEzV01w8iWfNes4oFkVx55mbWRp@redis-18830.c341.af-south-1-1.ec2.redns.redis-cloud.com:18830';
// Create Redis client
const client = (0, redis_1.createClient)({
    username: 'default',
    password: '3qag3SEzV01w8iWfNes4oFkVx55mbWRp',
    socket: {
        host: 'redis-18830.c341.af-south-1-1.ec2.redns.redis-cloud.com',
        port: 18830
    }
});
client.on('error', (err) => console.log('Redis Client Error', err));
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield client.connect();
    // Test Redis connection
    yield client.set('foo', 'bar');
    const result = yield client.get('foo');
    console.log('Redis test key value:', result); // >>> bar
}))();
// Create queues
const emailQueue = new bull_1.default('email-sending', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000 // 1 second initial delay
        },
        removeOnComplete: true
    }
});
const campaignQueue = new bull_1.default('campaign-processing', REDIS_URL);
// Rate limiting configuration
const RATE_LIMIT = {
    maxEmailsPerSecond: 10,
    maxBatchSize: 100,
    batchInterval: 1000 // 1 second
};
// Process individual emails
emailQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = job;
    try {
        yield (0, EmailService_1.sendEmail)(Object.assign({ to: data.to, from: data.from, replyTo: data.replyTo, subject: data.subject, html: data.html, text: data.text }, data.metadata));
        // Update campaign analytics
        const campaignService = new campaign_service_impl_1.CampaignServiceImpl();
        yield campaignService.updateCampaignAnalytics(data.campaignId, 'deliveries', 1);
        return { success: true, email: data.to };
    }
    catch (error) {
        // Update bounce analytics if it's a permanent failure
        if (error.permanent) {
            yield new campaign_service_impl_1.CampaignServiceImpl().updateCampaignAnalytics(data.campaignId, 'bounces', 1);
        }
        throw error;
    }
}));
// Process campaign batches
campaignQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaign, recipientBatch } = job.data;
    const batchPromises = [];
    for (const email of recipientBatch) {
        const emailData = {
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
        batchPromises.push(emailQueue.add(emailData, {
            priority: campaign.priority || 0,
            attempts: 3
        }));
    }
    yield Promise.all(batchPromises);
}));
// Error handling
emailQueue.on('error', (error) => {
    console.error('Email queue error:', error);
});
campaignQueue.on('error', (error) => {
    console.error('Campaign queue error:', error);
});
emailQueue.on('failed', (job, error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(`Email job failed for ${job.data.to}:`, error);
    // Update analytics for permanent failures
    if (error === null || error === void 0 ? void 0 : error.permanent) {
        yield new campaign_service_impl_1.CampaignServiceImpl().updateCampaignAnalytics(job.data.campaignId, 'bounces', 1);
    }
}));
// Clean old jobs
emailQueue.on('completed', (job) => __awaiter(void 0, void 0, void 0, function* () {
    yield job.remove();
}));
class EmailQueueService {
    addCampaign(campaign, recipients) {
        return __awaiter(this, void 0, void 0, function* () {
            const batchSize = Math.min(RATE_LIMIT.maxBatchSize, recipients.length);
            // Split recipients into batches
            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);
                yield campaignQueue.add({
                    campaign,
                    recipientBatch: batch
                }, {
                    priority: campaign.priority || 0,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000 // 2 second initial delay
                    }
                });
            }
        });
    }
    pauseProcessing() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                emailQueue.pause(),
                campaignQueue.pause()
            ]);
        });
    }
    resumeProcessing() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                emailQueue.resume(),
                campaignQueue.resume()
            ]);
        });
    }
    getQueueStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const [emailCounts, campaignCounts] = yield Promise.all([
                emailQueue.getJobCounts(),
                campaignQueue.getJobCounts()
            ]);
            return {
                waiting: emailCounts.waiting + campaignCounts.waiting,
                active: emailCounts.active + campaignCounts.active,
                completed: emailCounts.completed + campaignCounts.completed,
                failed: emailCounts.failed + campaignCounts.failed
            };
        });
    }
}
exports.queueService = new EmailQueueService();
