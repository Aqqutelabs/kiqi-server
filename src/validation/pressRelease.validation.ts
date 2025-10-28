import { z } from 'zod';

export const createPressReleaseSchema = z.object({
    body: z.object({
        campaign_id: z.string().nonempty('Campaign ID is required'),
        campaign: z.string().nonempty('Campaign name is required'),
        title: z.string().nonempty('Title is required'),
        pr_content: z.string().nonempty('Press release content is required'),
        status: z.enum(['Draft', 'Published', 'Scheduled'])
    })
});

export const updatePressReleaseSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        pr_content: z.string().optional(),
        status: z.enum(['Draft', 'Published', 'Scheduled']).optional(),
        campaign_id: z.string().optional()
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