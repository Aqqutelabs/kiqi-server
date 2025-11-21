"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublisherSchema = exports.createOrderSchema = exports.updatePressReleaseSchema = exports.createPressReleaseSchema = void 0;
const zod_1 = require("zod");
exports.createPressReleaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        campaign_id: zod_1.z.string().nonempty('Campaign ID is required'),
        pr_content: zod_1.z.string().nonempty('Press release content is required'),
        status: zod_1.z.enum(['Draft', 'Published', 'Scheduled'])
    })
});
exports.updatePressReleaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        pr_content: zod_1.z.string().optional(),
        status: zod_1.z.enum(['Draft', 'Published', 'Scheduled']).optional(),
        campaign_id: zod_1.z.string().optional()
    })
});
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        publications: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().nonempty('Publication name is required'),
            price: zod_1.z.string().nonempty('Price is required'),
            details: zod_1.z.string().nonempty('Publication details are required')
        })).nonempty('At least one publication is required'),
        payment_method: zod_1.z.enum(['Paystack', 'Crypto Wallet', 'Digital Wallet'])
    })
});
exports.createPublisherSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().nonempty('Publisher name is required'),
        description: zod_1.z.string().optional(),
        website: zod_1.z.string().url('Invalid URL format').optional(),
        turnaroundTime: zod_1.z.string().nonempty('Turnaround time is required'),
        industryFocus: zod_1.z.array(zod_1.z.string()).nonempty('At least one industry focus is required'),
        region: zod_1.z.array(zod_1.z.string()).nonempty('At least one region is required'),
        audienceReach: zod_1.z.string().nonempty('Audience reach is required'),
        price: zod_1.z.string().nonempty('Price is required'),
        isPopular: zod_1.z.boolean().optional(),
        isSelected: zod_1.z.boolean().optional(),
        metrics: zod_1.z.object({
            social_signals: zod_1.z.number().nonnegative('Social signals must be a positive number'),
            avg_traffic: zod_1.z.number().nonnegative('Average traffic must be a positive number'),
            trust_score: zod_1.z.number().min(0).max(100, 'Trust score must be between 0 and 100'),
            domain_authority: zod_1.z.number().min(0).max(100, 'Domain authority must be between 0 and 100')
        }),
        avg_publish_time: zod_1.z.string().nonempty('Average publish time is required'),
        publisherId: zod_1.z.string().nonempty('Publisher ID is required')
    })
});
