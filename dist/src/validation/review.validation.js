"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentReviewsQuerySchema = exports.getReviewsQuerySchema = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
// Create review schema
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5'),
        reviewText: zod_1.z.string()
            .min(10, 'Review text must be at least 10 characters')
            .max(1000, 'Review text cannot exceed 1000 characters'),
        reviewerName: zod_1.z.string()
            .max(100, 'Reviewer name cannot exceed 100 characters')
            .optional()
    })
});
// Update review schema
exports.updateReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot exceed 5')
            .optional(),
        reviewText: zod_1.z.string()
            .min(10, 'Review text must be at least 10 characters')
            .max(1000, 'Review text cannot exceed 1000 characters')
            .optional(),
        reviewerName: zod_1.z.string()
            .max(100, 'Reviewer name cannot exceed 100 characters')
            .optional(),
        status: zod_1.z.enum(['pending', 'verified', 'rejected'])
            .optional()
    })
});
// Query parameters for getting reviews
exports.getReviewsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        status: zod_1.z.enum(['pending', 'verified', 'rejected']).optional()
    })
});
// Query parameters for recent reviews (admin)
exports.getRecentReviewsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
        status: zod_1.z.enum(['pending', 'verified', 'rejected']).optional()
    })
});
