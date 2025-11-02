import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// Ensure req.user is defined
const getUserId = (req: Request): string => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'User not authenticated');
    }
    return req.user._id;
};

class SubscriptionController {
    // Create new subscription
    createSubscription = asyncHandler(async (req: Request, res: Response) => {
        const { planName, price, features, startDate, endDate, nextBillingDate, paymentMethodId } = req.body;
        
        const subscription = await Subscription.create({
            user_id: getUserId(req),
            planName,
            price,
            features,
            startDate,
            endDate,
            nextBillingDate,
            paymentMethodId
        });

        return res
            .status(201)
            .json(new ApiResponse(201, subscription, "Subscription created successfully"));
    });

    // Get user's active subscription
    getActiveSubscription = asyncHandler(async (req: Request, res: Response) => {
        const subscription = await Subscription.findOne({
            user_id: getUserId(req),
            status: 'Active'
        });

        if (!subscription) {
            throw new ApiError(404, "No active subscription found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subscription, "Active subscription retrieved successfully"));
    });

    // Cancel subscription
    cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
        const subscription = await Subscription.findOneAndUpdate(
            {
                user_id: getUserId(req),
                status: 'Active'
            },
            { status: 'Canceled' },
            { new: true }
        );

        if (!subscription) {
            throw new ApiError(404, "No active subscription found to cancel");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subscription, "Subscription cancelled successfully"));
    });

    // Get subscription history
    getSubscriptionHistory = asyncHandler(async (req: Request, res: Response) => {
        const subscriptions = await Subscription.find({
            user_id: getUserId(req)
        }).sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, subscriptions, "Subscription history retrieved successfully"));
    });

   
    updateSubscription = asyncHandler(async (req: Request, res: Response) => {
        const { planName, price, features, endDate, nextBillingDate } = req.body;

        const subscription = await Subscription.findOneAndUpdate(
            {
                user_id: getUserId(req),
                status: 'Active'
            },
            {
                planName,
                price,
                features,
                endDate,
                nextBillingDate
            },
            { new: true }
        );

        if (!subscription) {
            throw new ApiError(404, "No active subscription found to update");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, subscription, "Subscription updated successfully"));
    });
}

export const subscriptionController = new SubscriptionController();