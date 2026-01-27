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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentReviews = exports.deleteReview = exports.updateReview = exports.getReviewSummary = exports.getReviews = exports.createReview = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const Review_1 = require("../models/Review");
const PressRelease_1 = require("../models/PressRelease");
/**
 * Create a new review for a press release
 */
exports.createReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { pressReleaseId } = req.params;
    const { rating, reviewText, reviewerName } = req.body;
    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError_1.ApiError(400, 'Rating must be between 1 and 5');
    }
    if (!reviewText || reviewText.trim().length < 10) {
        throw new ApiError_1.ApiError(400, 'Review text must be at least 10 characters');
    }
    if (reviewText.length > 1000) {
        throw new ApiError_1.ApiError(400, 'Review text cannot exceed 1000 characters');
    }
    // Check if press release exists
    const pressRelease = yield PressRelease_1.PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Check if user has already reviewed this press release
    const existingReview = yield Review_1.Review.findOne({
        press_release_id: pressReleaseId,
        user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
    });
    if (existingReview) {
        throw new ApiError_1.ApiError(400, 'You have already reviewed this press release');
    }
    // Create new review
    const review = new Review_1.Review({
        press_release_id: pressReleaseId,
        user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
        reviewer_name: reviewerName || (req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null) || 'Anonymous',
        rating: parseInt(rating),
        review_text: reviewText.trim(),
        status: 'pending' // Reviews need moderation
    });
    yield review.save();
    return res.json(new ApiResponse_1.ApiResponse(201, {
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
}));
/**
 * Get all reviews for a press release
 */
exports.getReviews = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pressReleaseId } = req.params;
    const { page = 1, limit = 10, status = 'verified' } = req.query;
    // Check if press release exists
    const pressRelease = yield PressRelease_1.PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const reviews = yield Review_1.Review.find({
        press_release_id: pressReleaseId,
        status: status
    })
        .populate('user_id', 'firstName lastName email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum);
    const total = yield Review_1.Review.countDocuments({
        press_release_id: pressReleaseId,
        status: status
    });
    return res.json(new ApiResponse_1.ApiResponse(200, {
        reviews: reviews.map(review => {
            // Get the best available reviewer name
            const reviewerName = review.reviewer_name ||
                (review.user_id ? `${review.user_id.firstName || ''} ${review.user_id.lastName || ''}`.trim() : null) ||
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
}));
/**
 * Get review summary for a press release (ratings distribution, average, etc.)
 */
exports.getReviewSummary = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pressReleaseId } = req.params;
    // Check if press release exists
    const pressRelease = yield PressRelease_1.PressRelease.findById(pressReleaseId);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    const verifiedReviews = yield Review_1.Review.find({
        press_release_id: pressReleaseId,
        status: 'verified'
    });
    const totalReviews = verifiedReviews.length;
    if (totalReviews === 0) {
        return res.json(new ApiResponse_1.ApiResponse(200, {
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
        ratingDistribution[review.rating]++;
    });
    // Convert to percentages
    const ratingPercentages = {
        5: Math.round((ratingDistribution[5] / totalReviews) * 100),
        4: Math.round((ratingDistribution[4] / totalReviews) * 100),
        3: Math.round((ratingDistribution[3] / totalReviews) * 100),
        2: Math.round((ratingDistribution[2] / totalReviews) * 100),
        1: Math.round((ratingDistribution[1] / totalReviews) * 100)
    };
    return res.json(new ApiResponse_1.ApiResponse(200, {
        averageRating,
        totalReviews,
        ratingDistribution: ratingPercentages
    }));
}));
/**
 * Update a review (admin only or review owner)
 */
exports.updateReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { reviewId } = req.params;
    const { rating, reviewText, reviewerName, status } = req.body;
    const review = yield Review_1.Review.findById(reviewId);
    if (!review) {
        throw new ApiError_1.ApiError(404, 'Review not found');
    }
    // Check permissions - only admin or review owner can update
    const isAdmin = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    const isOwner = review.user_id && ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) && review.user_id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
        throw new ApiError_1.ApiError(403, 'You can only update your own reviews');
    }
    // Users can only update rating and text, admins can update status
    if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
            throw new ApiError_1.ApiError(400, 'Rating must be between 1 and 5');
        }
        review.rating = rating;
    }
    if (reviewText !== undefined) {
        if (reviewText.trim().length < 10) {
            throw new ApiError_1.ApiError(400, 'Review text must be at least 10 characters');
        }
        if (reviewText.length > 1000) {
            throw new ApiError_1.ApiError(400, 'Review text cannot exceed 1000 characters');
        }
        review.review_text = reviewText.trim();
    }
    if (reviewerName !== undefined && reviewerName.trim()) {
        review.reviewer_name = reviewerName.trim();
    }
    if (status !== undefined && isAdmin) {
        if (!['pending', 'verified', 'rejected'].includes(status)) {
            throw new ApiError_1.ApiError(400, 'Invalid status');
        }
        review.status = status;
    }
    yield review.save();
    return res.json(new ApiResponse_1.ApiResponse(200, {
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
}));
/**
 * Delete a review (admin only or review owner)
 */
exports.deleteReview = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { reviewId } = req.params;
    const review = yield Review_1.Review.findById(reviewId);
    if (!review) {
        throw new ApiError_1.ApiError(404, 'Review not found');
    }
    // Check permissions
    const isAdmin = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
    const isOwner = review.user_id && ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) && review.user_id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
        throw new ApiError_1.ApiError(403, 'You can only delete your own reviews');
    }
    yield Review_1.Review.findByIdAndDelete(reviewId);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        message: 'Review deleted successfully'
    }));
}));
/**
 * Get recent reviews across all press releases (for admin dashboard)
 */
exports.getRecentReviews = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const query = {};
    if (status) {
        query.status = status;
    }
    const reviews = yield Review_1.Review.find(query)
        .populate('press_release_id', 'title')
        .populate('user_id', 'firstName lastName email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum);
    const total = yield Review_1.Review.countDocuments(query);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        reviews: reviews.map(review => {
            var _a;
            return ({
                _id: review._id,
                press_release_title: ((_a = review.press_release_id) === null || _a === void 0 ? void 0 : _a.title) || 'Unknown',
                reviewer_name: review.reviewer_name,
                rating: review.rating,
                review_text: review.review_text,
                status: review.status,
                created_at: review.created_at
            });
        }),
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            totalReviews: total,
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
        }
    }));
}));
