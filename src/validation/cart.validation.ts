import { z } from 'zod';

export const addToCartSchema = z.object({
    body: z.object({
        publisherId: z.string().nonempty('Publisher ID is required'),
        addons: z.array(z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            type: z.string()
        })).optional(),
        selectedAddons: z.array(z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            type: z.string()
        })).optional(),
        totalPrice: z.number().optional()
    })
});

export const updateCartItemSchema = z.object({
    body: z.object({
        selected: z.boolean()
    })
});

export const removeFromCartSchema = z.object({
    params: z.object({
        publisherId: z.string().nonempty('Publisher ID is required')
    })
});