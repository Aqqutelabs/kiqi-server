import { z } from 'zod';

// Create review schema
export const createReviewSchema = z.object({
    body: z.object({
        rating: z.number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5'),
        reviewText: z.string()
            .min(10, 'Review text must be at least 10 characters')
            .max(1000, 'Review text cannot exceed 1000 characters'),
        reviewerName: z.string()
            .max(100, 'Reviewer name cannot exceed 100 characters')
            .optional()
    })
});

// Update review schema
export const updateReviewSchema = z.object({
    body: z.object({
        rating: z.number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5')
            .optional(),
        reviewText: z.string()
            .min(10, 'Review text must be at least 10 characters')
            .max(1000, 'Review text cannot exceed 1000 characters')
            .optional(),
        reviewerName: z.string()
            .max(100, 'Reviewer name cannot exceed 100 characters')
            .optional(),
        status: z.enum(['pending', 'verified', 'rejected'])
            .optional()
    })
});

// Query parameters for getting reviews
export const getReviewsQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        status: z.enum(['pending', 'verified', 'rejected']).optional()
    })
});

// Query parameters for recent reviews (admin)
export const getRecentReviewsQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        status: z.enum(['pending', 'verified', 'rejected']).optional()
    })
});