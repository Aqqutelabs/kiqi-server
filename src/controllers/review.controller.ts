import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { Review } from '../models/Review';
import { PressRelease } from '../models/PressRelease';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import mongoose from 'mongoose';

/**
 * Create a new review for a press release
 */
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pressReleaseId } = req.params;
    const { rating, reviewText, reviewerName } = req.body;

    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, 'Rating must be between 1 and 5');
    }
    if (!reviewText || reviewText.trim().length < 10) {
        throw new ApiError(400, 'Review text must be at least 10 characters');
    }
    if (reviewText.length > 1000) {
        throw new ApiError(400, 'Review text cannot exceed 1000 characters');
    }

    // Check if press release exists
    const pressRelease = await PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Check if user has already reviewed this press release
    const existingReview = await Review.findOne({
        press_release_id: pressReleaseId,
        user_id: req.user?._id
    });

    if (existingReview) {
        if (existingReview.status === 'verified') {
            throw new ApiError(400, 'You have already reviewed this press release');
        } else if (existingReview.status === 'pending') {
            // Update the existing pending review
            existingReview.rating = parseInt(rating);
            existingReview.review_text = reviewText.trim();
            existingReview.reviewer_name = reviewerName || (req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null) || 'Anonymous';
            await existingReview.save();

            return res.json(new ApiResponse(200, {
                message: 'Review updated successfully. It will be published after moderation.',
                review: {
                    _id: existingReview._id,
                    rating: existingReview.rating,
                    review_text: existingReview.review_text,
                    reviewer_name: existingReview.reviewer_name,
                    created_at: existingReview.created_at,
                    status: existingReview.status
                }
            }));
        }
    }

    // Create new review
    const review = new Review({
        press_release_id: pressReleaseId,
        user_id: req.user?._id,
        reviewer_name: reviewerName || (req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null) || 'Anonymous',
        rating: parseInt(rating),
        review_text: reviewText.trim(),
        status: 'pending' // Reviews need moderation
    });

    await review.save();

    return res.json(new ApiResponse(201, {
        message: 'Review submitted successfully. It will be published after moderation.',
        review: {
            _id: review._id,
            rating: review.rating,
            review_text: review.review_text,
            reviewer_name: review.reviewer_name,
            created_at: review.created_at,
            status: review.status
        }
    }));
});

/**
 * Get all reviews for a press release
 */
export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pressReleaseId } = req.params;
    const { page = 1, limit = 10, status = 'verified' } = req.query;

    // Check if press release exists
    const pressRelease = await PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({
        press_release_id: pressReleaseId,
        $or: [
            { status: status },
            { status: 'pending', user_id: req.user?._id }
        ]
    })
    .populate('user_id', 'firstName lastName email')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limitNum);

    const total = await Review.countDocuments({
        press_release_id: pressReleaseId,
        $or: [
            { status: status },
            { status: 'pending', user_id: req.user?._id }
        ]
    });

    return res.json(new ApiResponse(200, {
        reviews: reviews.map(review => {
            // Get the best available reviewer name
            const reviewerName = review.reviewer_name ||
                (review.user_id ? `${(review.user_id as any).firstName || ''} ${(review.user_id as any).lastName || ''}`.trim() : null) ||
                'Anonymous';

            return {
                _id: review._id,
                reviewer_name: reviewerName,
                rating: review.rating,
                review_text: review.review_text,
                created_at: review.created_at,
                date_formatted: new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                status: review.status
            };
        }),
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalReviews: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
        }
    }));
});

/**
 * Get review summary for a press release (ratings distribution, average, etc.)
 */
export const getReviewSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { pressReleaseId } = req.params;

    // Check if press release exists
    const pressRelease = await PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    const verifiedReviews = await Review.find({
        press_release_id: pressReleaseId,
        status: 'verified'
    });

    const totalReviews = verifiedReviews.length;

    if (totalReviews === 0) {
        return res.json(new ApiResponse(200, {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0
            }
        }));
    }

    // Calculate average rating
    const totalRating = verifiedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

    // Calculate rating distribution
    const ratingDistribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
    };

    verifiedReviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    // Convert to percentages
    const ratingPercentages = {
        5: Math.round((ratingDistribution[5] / totalReviews) * 100),
        4: Math.round((ratingDistribution[4] / totalReviews) * 100),
        3: Math.round((ratingDistribution[3] / totalReviews) * 100),
        2: Math.round((ratingDistribution[2] / totalReviews) * 100),
        1: Math.round((ratingDistribution[1] / totalReviews) * 100)
    };

    return res.json(new ApiResponse(200, {
        averageRating,
        totalReviews,
        ratingDistribution: ratingPercentages
    }));
});

/**
 * Update a review (admin only or review owner)
 */
export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reviewId } = req.params;
    const { rating, reviewText, reviewerName, status } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    // Check permissions - only admin or review owner can update
    const isAdmin = req.user?.role === 'admin';
    const isOwner = review.user_id && req.user?._id && review.user_id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
        throw new ApiError(403, 'You can only update your own reviews');
    }

    // Users can only update rating and text, admins can update status
    if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
            throw new ApiError(400, 'Rating must be between 1 and 5');
        }
        review.rating = rating;
    }

    if (reviewText !== undefined) {
        if (reviewText.trim().length < 10) {
            throw new ApiError(400, 'Review text must be at least 10 characters');
        }
        if (reviewText.length > 1000) {
            throw new ApiError(400, 'Review text cannot exceed 1000 characters');
        }
        review.review_text = reviewText.trim();
    }

    if (reviewerName !== undefined && reviewerName.trim()) {
        review.reviewer_name = reviewerName.trim();
    }

    if (status !== undefined && isAdmin) {
        if (!['pending', 'verified', 'rejected'].includes(status)) {
            throw new ApiError(400, 'Invalid status');
        }
        review.status = status;
    }

    await review.save();

    return res.json(new ApiResponse(200, {
        message: 'Review updated successfully',
        review: {
            _id: review._id,
            reviewer_name: review.reviewer_name,
            rating: review.rating,
            review_text: review.review_text,
            status: review.status,
            updated_at: review.updated_at
        }
    }));
});

/**
 * Delete a review (admin only or review owner)
 */
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    // Check permissions
    const isAdmin = req.user?.role === 'admin';
    const isOwner = review.user_id && req.user?._id && review.user_id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
        throw new ApiError(403, 'You can only delete your own reviews');
    }

    await Review.findByIdAndDelete(reviewId);

    return res.json(new ApiResponse(200, {
        message: 'Review deleted successfully'
    }));
});

/**
 * Get recent reviews across all press releases (for admin dashboard)
 */
export const getRecentReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (status) {
        query.status = status;
    }

    const reviews = await Review.find(query)
        .populate('press_release_id', 'title')
        .populate('user_id', 'firstName lastName email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Review.countDocuments(query);

    return res.json(new ApiResponse(200, {
        reviews: reviews.map(review => ({
            _id: review._id,
            press_release_title: (review.press_release_id as any)?.title || 'Unknown',
            reviewer_name: review.reviewer_name,
            rating: review.rating,
            review_text: review.review_text,
            status: review.status,
            created_at: review.created_at
        })),
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalReviews: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
        }
    }));
});