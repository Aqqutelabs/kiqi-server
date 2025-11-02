import { z } from 'zod';

export const addToCartSchema = z.object({
    body: z.object({
        publisherId: z.string().nonempty('Publisher ID is required')
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