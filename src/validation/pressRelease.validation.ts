import { z } from 'zod';

export const createPressReleaseSchema = z.object({
    body: z.object({
        pr_content: z.string().nonempty('Press release content is required'),
        status: z.enum(['Draft', 'Published', 'Scheduled'])
    })
});

export const updatePressReleaseSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        pr_content: z.string().optional(),
        status: z.enum(['Draft', 'Published', 'Scheduled']).optional()
    })
});

export const createOrderSchema = z.object({
    body: z.object({
        publications: z.array(z.object({
            name: z.string().nonempty('Publication name is required'),
            price: z.string().nonempty('Price is required'),
            details: z.string().nonempty('Publication details are required')
        })).nonempty('At least one publication is required'),
        payment_method: z.enum(['Paystack', 'Crypto Wallet', 'Digital Wallet'])
    })
});

export const createPublisherSchema = z.object({
    body: z.object({
        name: z.string().nonempty('Publisher name is required'),
        description: z.string().optional(),
        website: z.string().url('Invalid URL format').optional(),
        turnaroundTime: z.string().nonempty('Turnaround time is required'),
        industryFocus: z.array(z.string()).nonempty('At least one industry focus is required'),
        region: z.array(z.string()).nonempty('At least one region is required'),
        audienceReach: z.string().nonempty('Audience reach is required'),
        price: z.string().nonempty('Price is required'),
        isPopular: z.boolean().optional(),
        isSelected: z.boolean().optional(),
        metrics: z.object({
            social_signals: z.number().nonnegative('Social signals must be a positive number'),
            avg_traffic: z.number().nonnegative('Average traffic must be a positive number'),
            trust_score: z.number().min(0).max(100, 'Trust score must be between 0 and 100'),
            domain_authority: z.number().min(0).max(100, 'Domain authority must be between 0 and 100')
        }),
        avg_publish_time: z.string().nonempty('Average publish time is required'),
        publisherId: z.string().nonempty('Publisher ID is required')
    })
});