import { Request, Response, NextFunction } from 'express';
import { Subscription, SubscriptionDocument, SubscriptionBase } from '../models/Subscription';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import axios from 'axios';

// Auth types
interface AuthUser {
    _id: string;
    [key: string]: any;
}

interface AuthRequest extends Request {
    user: AuthUser;
}

type AuthRequestHandler = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => Promise<any>;

// Type for subscription metadata
interface SubscriptionMetadata {
    lastBillingDate: Date;
    cancellationDate?: Date;
    reason?: string;
}

const authHandler = (handler: AuthRequestHandler) =>
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // express Request doesn't have user by default, ensure it exists
        const anyReq = req as AuthRequest;
        if (!anyReq.user || !anyReq.user._id) {
            throw new ApiError(401, 'User not authenticated');
        }
        return await handler(anyReq, res, next);
    });

class SubscriptionController {
    // Subscribe to a plan
    subscribeToPlan = authHandler(async (req: AuthRequest, res: Response) => {
        const { planName }: { planName: string } = req.body;

        if (!planName) {
            throw new ApiError(400, 'planName is required');
        }

        // Validate plan name
        if (!['Basic', 'Pro', 'Enterprise'].includes(planName)) {
            throw new ApiError(400, 'Invalid plan name. Must be Basic, Pro, or Enterprise');
        }

        const validatedPlanName = planName as 'Basic' | 'Pro' | 'Enterprise';

        // Check for existing active subscription
        const existingSubscription = await Subscription.findOne({
            user_id: req.user._id,
            status: 'Active'
        }).exec();

        if (existingSubscription) {
            throw new ApiError(400, "User already has an active subscription");
        }

        // Get plan details
        const planDetails = this.getPlanDetails(validatedPlanName);
        if (!planDetails) {
            throw new ApiError(400, "Invalid plan selected");
        }

        const amountInKobo = planDetails.price * 100; // Convert to kobo for Paystack
        console.log('paystack test secret key:', process.env.PAYSTACK_TEST_SECRET_KEY); 
        try {
            const response = await axios.post(
                "https://api.paystack.co/transaction/initialize",
                { 
                    
                    email: req.user.email,
                    amount: amountInKobo,
                    callback_url: `https://gokiki.app/payment/success`,
                    metadata: {
                        planName: validatedPlanName,
                        userId: req.user._id,
                    },
                },
                {   
                    headers: {
                        
                        Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            res.status(200).json(new ApiResponse(200, { authorizationUrl: response.data.data.authorization_url }, "Payment link generated successfully"));
        } catch (error) {
            throw new ApiError(500, "Failed to initialize payment");
        }
    });

    // Subscribe to a plan
    subscribe = authHandler(async (req: AuthRequest, res: Response) => {
        const { planId, paymentMethod }: { planId: string; paymentMethod: string } = req.body;

        if (!planId) {
            throw new ApiError(400, 'planId is required');
        }

        if (!paymentMethod || !['paystack', 'card'].includes(paymentMethod)) {
            throw new ApiError(400, 'Invalid payment method. Must be either paystack or card');
        }

        // Retrieve plan details (assuming a method exists to fetch plan by ID)
        const plan = this.getPlanDetailsById(planId);
        if (!plan) {
            throw new ApiError(400, "Invalid plan selected");
        }

        const amountInKobo = plan.price * 100; // Convert to kobo for Paystack

        try {
            const response = await axios.post(
                "https://api.paystack.co/transaction/initialize",
                {
                    email: req.user.email,
                    amount: amountInKobo,
                    callback_url: `${process.env.FRONTEND_URL}/payment/success`,
                    metadata: {
                        planId,
                        userId: req.user._id,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            res.json({ authorizationUrl: response.data.data.authorization_url });
        } catch (error) {
            throw new ApiError(500, "Failed to initialize payment");
        }
    });

    // Verify payment and activate subscription
    verifyPayment = authHandler(async (req: AuthRequest, res: Response) => {
        const { reference }: { reference: string } = req.body;

        if (!reference) {
            throw new ApiError(400, "Payment reference is required");
        }

        try {
            // Verify payment with Paystack
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                    },
                }
            );

            const paymentData = response.data.data;

            if (paymentData.status !== 'success') {
                throw new ApiError(400, "Payment verification failed");
            }

            const { metadata } = paymentData;
            const { planName, userId } = metadata;

            // Validate plan name
            const planDetails = this.getPlanDetails(planName);
            if (!planDetails) {
                throw new ApiError(400, "Invalid plan selected");
            }

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);

            // Map Paystack channel to enum (using plain string type to avoid missing enum type)
            const paystackChannelMap: Record<string, string> = {
                card: 'Card',
                bank: 'BankTransfer',
                ussd: 'Wallet',
                mobile_money: 'Wallet',
                paystack: 'Paystack',
            };

            const channelType = paystackChannelMap[paymentData.channel] || 'Paystack';

            // Create subscription
            const subscription = await Subscription.create({
                user_id: userId,
                planName,
                price: planDetails.price,
                features: planDetails.features,
                startDate,
                endDate,
                nextBillingDate: endDate,
                monthlyCredits: planDetails.monthlyCredits,
                coinMultiplier: planDetails.coinMultiplier,
                billingCycle: 'monthly',
                autoRenew: true, // Default auto-renew
                status: 'Active',
                metadata: {
                    lastBillingDate: startDate
                } as SubscriptionMetadata
            });

            // Save transaction details
            await Transaction.create({
                user_id: userId,
                transactionId: paymentData.reference,
                description: `Payment for ${planName} subscription`,
                amount: paymentData.amount / 100, // Convert from kobo to base currency
                type: 'Credit',
                status: 'Completed',
                channel: channelType,
                currencyType: 'go_credits',
                paymentMethod: {
                    type: channelType,
                    details: {},
                },
                metadata: {
                    subscriptionId: subscription._id,
                },
            });

            res.status(200).json(new ApiResponse(200, { subscription }, "Subscription activated successfully"));
        } catch (error: any) {
    console.error('Paystack Error:', error.response?.data || error.message);
    throw new ApiError(500, "Failed to verify payment");
}
    });

    // Get subscription details with usage
    getSubscriptionDetails = authHandler(async (req: AuthRequest, res: Response) => {
        const subscription = (await Subscription.findOne({
            user_id: req.user._id,
            status: 'Active'
        }).exec()) as SubscriptionDocument | null;

        if (!subscription) {
            throw new ApiError(404, "No active subscription found");
        }

        // Get usage statistics for current month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const usage = await Transaction.aggregate([
            {
                $match: {
                    user_id: req.user._id,
                    type: 'Debit',
                    currency_type: 'go_credits',
                    createdAt: { $gte: firstDayOfMonth } // use createdAt as standard mongoose timestamp
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]).exec();

        const monthlyUsage = (usage && usage[0] && usage[0].total) ? usage[0].total : 0;

        const remaining = (subscription.monthlyCredits ?? 0) - monthlyUsage;

        return res.status(200).json(new ApiResponse(200, {
            subscription,
            usage: {
                monthly_credits: subscription.monthlyCredits ?? 0,
                used_credits: monthlyUsage,
                remaining_credits: remaining < 0 ? 0 : remaining,
                coin_multiplier: subscription.coinMultiplier ?? 1
            }
        }, "Subscription details retrieved successfully"));
    });

    // Update subscription plan or settings
    updateSubscription = authHandler(async (req: AuthRequest, res: Response) => {
        const { planName, billingCycle, autoRenew }: {
            planName?: string;
            billingCycle?: 'monthly' | 'annual';
            autoRenew?: boolean;
        } = req.body;

        const subscription = (await Subscription.findOne({
            user_id: req.user._id,
            status: 'Active'
        }).exec()) as SubscriptionDocument | null;

        if (!subscription) {
            throw new ApiError(404, "No active subscription found");
        }

        if (planName) {
           const newPlanDetails = this.getPlanDetails(planName as 'Basic' | 'Pro' | 'Enterprise');
            if (!newPlanDetails) {
                throw new ApiError(400, "Invalid plan selected");
            }

            subscription.planName = planName as 'Basic' | 'Pro' | 'Enterprise';
            subscription.monthlyCredits = newPlanDetails.monthlyCredits;
            subscription.coinMultiplier = newPlanDetails.coinMultiplier;
            subscription.price = newPlanDetails.price * (subscription.billingCycle === 'annual' ? 12 * 0.9 : 1);
            subscription.features = newPlanDetails.features;

            // Update wallet monthly limit
            await Wallet.findOneAndUpdate(
                { user_id: req.user._id },
                { monthly_limit: newPlanDetails.monthlyCredits }
            ).exec();
        }

        if (billingCycle && billingCycle !== subscription.billingCycle) {
            subscription.billingCycle = billingCycle;
            // Recalculate end date and next billing date from startDate
            const newEndDate = new Date(subscription.startDate);
            if (billingCycle === 'annual') {
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            } else {
                newEndDate.setMonth(newEndDate.getMonth() + 1);
            }
            subscription.endDate = newEndDate;
            subscription.nextBillingDate = newEndDate;
            // Recalculate price if needed
            subscription.price = (this.getPlanDetails(subscription.planName)?.price ?? 0) *
                (billingCycle === 'annual' ? 12 * 0.9 : 1);
        }

        if (typeof autoRenew === 'boolean') {
            subscription.autoRenew = autoRenew;
        }

        await subscription.save();

        return res.status(200).json(new ApiResponse(200, { subscription }, "Subscription updated successfully"));
    });

    // Cancel subscription
    cancelSubscription = authHandler(async (req: AuthRequest, res: Response) => {
        const { reason }: { reason?: string } = req.body;

        const subscription = (await Subscription.findOne({
            user_id: req.user._id,
            status: 'Active'
        }).exec()) as SubscriptionDocument | null;

        if (!subscription) {
            throw new ApiError(404, "No active subscription found");
        }

        subscription.status = 'Canceled';
        subscription.metadata = {
            ...(subscription.metadata || {}),
            cancellationDate: new Date(),
            reason
        } as SubscriptionMetadata;
        await subscription.save();

        return res.status(200).json(new ApiResponse(200, { subscription }, "Subscription cancelled successfully"));
    });

    // Initiate payment for a subscription
    initiatePayment = authHandler(async (req: AuthRequest, res: Response) => {
        const { planName, paymentMethod }: { planName: string; paymentMethod: string } = req.body;

        if (!planName) {
            throw new ApiError(400, 'planName is required');
        }

        if (!paymentMethod || !['card', 'paystack'].includes(paymentMethod)) {
            throw new ApiError(400, 'Invalid payment method. Must be either card or paystack');
        }

        // Validate plan name
        const plan = this.getPlanDetails(planName as 'Basic' | 'Pro' | 'Enterprise');
        if (!plan) {
            throw new ApiError(400, "Invalid plan selected");
        }

        const amount = plan.price * 100; // Paystack uses kobo

        try {
            const response = await axios.post(
                "https://api.paystack.co/transaction/initialize",
                {
                    email: req.user.email,
                    amount,
                    callback_url: `${process.env.APP_URL}/api/subscription/verify-payment`,
                    metadata: {
                        userId: req.user._id,
                        planName,
                        paymentMethod,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            res.json({ authorizationUrl: response.data.data.authorization_url });
        } catch (error) {
            throw new ApiError(500, "Failed to initiate payment");
        }
    });

    // Verify payment and activate subscription
    // verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    //     const { reference } = req.query;

    //     if (!reference) {
    //         throw new ApiError(400, "Payment reference is required");
    //     }

    //     try {
    //         const response = await axios.get(
    //             `https://api.paystack.co/transaction/verify/${reference}`,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    //                 },
    //             }
    //         );

    //         const paymentData = response.data.data;

    //         if (paymentData.status !== 'success') {
    //             throw new ApiError(400, "Payment verification failed");
    //         }

    //         const { metadata } = paymentData;
    //         const { userId, planName, paymentMethod } = metadata;

    //         // Validate plan name
    //         const plan = this.getPlanDetails(planName as 'Basic' | 'Pro' | 'Enterprise');
    //         if (!plan) {
    //             throw new ApiError(400, "Invalid plan selected");
    //         }

    //         const startDate = new Date();
    //         const endDate = new Date(startDate);
    //         endDate.setMonth(endDate.getMonth() + 1);

    //         // Price calculation
    //         const price = plan.price;

    //         // Create subscription
    //         const subscription = (await Subscription.create({
    //             user_id: userId,
    //             planName: planName as 'Basic' | 'Pro' | 'Enterprise',
    //             price,
    //             features: plan.features,
    //             startDate,
    //             endDate,
    //             nextBillingDate: endDate,
    //             monthlyCredits: plan.monthlyCredits,
    //             coinMultiplier: plan.coinMultiplier,
    //             billingCycle: 'monthly',
    //             autoRenew: true, // Default auto-renew
    //             status: 'Active',
    //             metadata: {
    //                 lastBillingDate: startDate
    //             } as SubscriptionMetadata
    //         })) as SubscriptionDocument;

    //         // Store payment receipt
    //         await Transaction.create({
    //             user_id: userId,
    //             transactionId: paymentData.reference,
    //             description: `Payment for ${planName} subscription`,
    //             amount: paymentData.amount / 100, // Convert from kobo to base currency
    //             type: 'Credit',
    //             status: 'Completed',
    //             channel: paymentData.channel,
    //             currencyType: 'go_credits',
    //             paymentMethod: {
    //                 type: paymentMethod,
    //                 details: {},
    //             },
    //             metadata: {
    //                 subscriptionId: subscription._id,
    //             },
    //         });

    //         res.status(200).json(new ApiResponse(200, { subscription }, "Subscription activated successfully"));
    //     } catch (error) {
    //         throw new ApiError(500, "Failed to verify payment");
    //     }
    // });

    private getPlanDetails(planName: SubscriptionBase['planName']) {
        // This would typically come from a database or configuration
        const plans: Record<SubscriptionBase['planName'], {
            price: number;
            monthlyCredits: number;
            coinMultiplier: number;
            features: string[];
        }> = {
            'Basic': {
                price: 49.99,
                monthlyCredits: 5000,
                coinMultiplier: 1,
                features: ['Basic features', '5000 monthly credits', '1x coin multiplier']
            },
            'Pro': {
                price: 99.99,
                monthlyCredits: 12000,
                coinMultiplier: 2,
                features: ['Pro features', '12000 monthly credits', '2x coin multiplier', 'Priority support']
            },
            'Enterprise': {
                price: 199.99,
                monthlyCredits: 30000,
                coinMultiplier: 3,
                features: ['Enterprise features', '30000 monthly credits', '3x coin multiplier', 'Dedicated support', 'Custom integrations']
            }
        };

        return plans[planName];
    }

    private getPlanDetailsById(planId: string) {
        // Mock implementation: Map planId to planName
        const planMapping: Record<string, SubscriptionBase['planName']> = {
            '1': 'Basic',
            '2': 'Pro',
            '3': 'Enterprise',
        };

        const planName = planMapping[planId];
        if (!planName) {
            return null;
        }

        const details = this.getPlanDetails(planName);
        if (!details) {
            return null;
        }

        return {
            name: planName,
            price: details.price,
            monthlyCredits: details.monthlyCredits,
            coinMultiplier: details.coinMultiplier,
            features: details.features
        };
    }

    // Get subscription history
    getSubscriptionHistory = authHandler(async (req: AuthRequest, res: Response) => {
        const subscriptions = await Subscription.find({
            user_id: req.user._id
        }).sort({ createdAt: -1 }).exec();

        return res
            .status(200)
            .json(new ApiResponse(200, subscriptions, "Subscription history retrieved successfully"));
    });

}

export const subscriptionController = new SubscriptionController();
