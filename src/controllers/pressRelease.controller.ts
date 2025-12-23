import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { PressRelease } from '../models/PressRelease';
import { PressReleaseProgress, ProgressStep } from '../models/PressReleaseProgress';
import { Publisher } from '../models/Publisher';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { initializePaystackPayment, verifyPaystackPayment } from '../utils/paystack';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import { CheckoutPublicationItem, PressReleaseTracker, ProgressTrackerResponse } from '../types/pressRelease.types';
import { v2 as cloudinary } from 'cloudinary';
import { createHmac } from 'crypto';

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: 'dphdvbdwg', 
    api_key: '164375779418948', 
    api_secret: 'otQq6cFFzqGeQO4umSVrrFumA30' // Replace with your actual API secret
});

/**
 * Helper function to record a progress step for a press release
 * This creates/updates the tracking record in the database
 */
export const recordProgressStep = async (
    prId: any,
    userId: any,
    step: ProgressStep,
    notes?: string,
    metadata?: any
) => {
    try {
        console.log(`📍 Recording progress step: ${step} for PR: ${prId}, User: ${userId}`);
        
        let progress = await PressReleaseProgress.findOne({
            press_release_id: prId,
            user_id: userId
        });

        if (!progress) {
            console.log(`📝 Creating new progress record for PR: ${prId}`);
            // Create new progress record
            progress = new PressReleaseProgress({
                press_release_id: prId,
                user_id: userId,
                current_step: step,
                progress_history: [{
                    step,
                    timestamp: new Date(),
                    notes,
                    metadata
                }]
            });
        } else {
            console.log(`🔄 Updating existing progress record for PR: ${prId}`);
            // Update existing progress record
            progress.current_step = step;
            progress.progress_history.push({
                step,
                timestamp: new Date(),
                notes,
                metadata
            });
        }

        // Update status-specific fields
        switch (step) {
            case 'initiated':
                progress.initiated_at = new Date();
                break;
            case 'payment_completed':
                progress.payment_completed_at = new Date();
                break;
            case 'under_review':
                progress.under_review_at = new Date();
                break;
            case 'approved':
                progress.completed_at = new Date();
                break;
            case 'rejected':
                progress.rejected_at = new Date();
                progress.rejection_reason = metadata?.rejection_reason || 'No reason provided';
                break;
        }

        progress.updated_at = new Date();
        await progress.save();

        console.log(`✅ Progress step recorded successfully: ${step} for PR: ${prId}`);
        return progress;
    } catch (error) {
        console.error('❌ Error recording progress step:', error);
        throw error;
    }
};

/**
 * Helper function to get the full progress timeline for a press release
 */
export const getProgressTimeline = async (prId: any, userId: any) => {
    try {
        console.log(`🔍 Searching for progress timeline: PR=${prId}, User=${userId}`);
        
        const progress = await PressReleaseProgress.findOne({
            press_release_id: prId,
            user_id: userId
        });

        if (!progress) {
            console.warn(`⚠️  Progress record NOT found for PR: ${prId}, User: ${userId}`);
            return null;
        }

        console.log(`✅ Progress record found for PR: ${prId}, Current step: ${progress.current_step}`);

        return {
            press_release_id: progress.press_release_id,
            current_step: progress.current_step,
            initiated_at: progress.initiated_at,
            payment_completed_at: progress.payment_completed_at,
            under_review_at: progress.under_review_at,
            completed_at: progress.completed_at,
            rejected_at: progress.rejected_at,
            rejection_reason: progress.rejection_reason,
            progress_history: progress.progress_history.map(record => ({
                step: record.step,
                timestamp: record.timestamp,
                notes: record.notes,
                metadata: record.metadata
            }))
        };
    } catch (error) {
        console.error('❌ Error getting progress timeline:', error);
        throw error;
    }
};

export const getPressReleasesList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    
    const pressReleases = await PressRelease.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .select('_id title status distribution campaign performance_views date_created');

    const pr_list = pressReleases.map(pr => ({
        _id: pr._id,
        title: pr.title,
        status: pr.status,
        distribution: pr.distribution,
        campaign: pr.campaign,
        performance_views: pr.performance_views,
        date_created: pr.date_created
    }));

    return res.json(new ApiResponse(200, pr_list));
});

export const getDashboardMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const pressReleases = await PressRelease.find({ user_id: userId });
    const orders = await Order.find({ user_id: userId });

    const total_press_releases = pressReleases.length;
    const total_views = pressReleases.reduce((acc, pr) => acc + pr.metrics.total_views, 0);
    const total_spent = orders.reduce((acc, order) => {
        const amount = parseFloat(order.order_summary.total_amount.replace(/[^0-9.-]+/g, ''));
        return acc + amount;
    }, 0);
    const total_channels = new Set(pressReleases.flatMap(pr => 
        pr.distribution_report.map(dr => dr.outlet_name)
    )).size;

    const pr_list = pressReleases.map(pr => ({
        title: pr.title,
        status: pr.status,
        distribution: pr.distribution,
        campaign: pr.campaign,
        performance_views: pr.performance_views,
        date_created: pr.date_created
    }));

    return res.json(new ApiResponse(200, {
        total_press_releases,
        total_views: `${(total_views / 1000).toFixed(1)}K`,
        total_spent: `₦${total_spent.toLocaleString()}`,
        total_channels,
        pr_list
    }));
});

export const getPressReleaseStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const pressReleases = await PressRelease.find({ user_id: userId });
    const orders = await Order.find({ user_id: userId });

    const press_releases_count = pressReleases.length;
    const press_release_views = pressReleases.reduce((acc, pr) => acc + pr.metrics.total_views, 0);
    
    const total_amount_spent = orders.reduce((acc, order) => {
        const amount = parseFloat(order.order_summary.total_amount.replace(/[^0-9.-]+/g, ''));
        return acc + amount;
    }, 0);

    const media_channels = new Set(pressReleases.flatMap(pr => 
        pr.distribution_report.map(dr => dr.outlet_name)
    )).size;

    return res.json(new ApiResponse(200, {
        press_releases: {
            count: press_releases_count,
            change: 0,
            trend: 0
        },
        press_release_views: {
            count: press_release_views,
            change: 0,
            trend: 0
        },
        total_amount_spent: {
            amount: `$${(total_amount_spent / 550).toFixed(2)}`, // Convert to USD (assuming 550 NGN = 1 USD approximately)
            change: 0,
            trend: 0
        },
        media_channels: {
            count: media_channels
        }
    }));
});

export const getPressReleaseDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pressRelease = await PressRelease.findById(req.params.id);
    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    if (!pressRelease.title) {
        console.warn(`Press release with ID ${req.params.id} is missing the title field.`);
    }

    // Ensure response includes all fields including title
    const responseData = {
        ...pressRelease.toObject(),
        title: pressRelease.title
    };

    return res.json(new ApiResponse(200, responseData));
});

export const createPressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('Request body:', req.body);
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    const { campaign, pr_content, status, title, distribution, performance_views } = req.body;

    // Validate title
    if (!title) {
        throw new ApiError(400, 'Title is required');
    }

    let imageUrl = '';

    // Handle image upload to Cloudinary
    if (req.file) {
        try {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'press_releases',
                public_id: `${userId}_${Date.now()}`
            });
            imageUrl = uploadResult.secure_url;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new ApiError(500, 'Failed to upload image');
        }
    }

    const pressRelease = await PressRelease.create({
        campaign: campaign || title || '',  // prefer explicit campaign, fallback to title
        title: title || '',
        content: pr_content,
        status,
        distribution: distribution || '',
        performance_views: performance_views || '0',
        image: imageUrl, // Store the Cloudinary image URL
        user_id: userId,  // userId is already checked above
        date_created: new Date().toISOString(),
        metrics: {
            total_views: 0,
            total_clicks: 0,
            engagement_rate: '0%',
            avg_time_on_page: '0:00'
        }
    });

    console.log(`✅ PR created successfully: ${pressRelease._id}`);

    // Record the initial progress step
    try {
        await recordProgressStep(
            pressRelease._id,
            userId,
            'initiated',
            `Press release "${title}" initiated`,
            { title, status }
        );
        console.log(`✅ Progress step recorded for PR: ${pressRelease._id}`);
    } catch (progressError) {
        console.error(`❌ Failed to record progress step for PR: ${pressRelease._id}`, progressError);
        // Don't throw - PR was created successfully, just log the error
    }

    return res.json(new ApiResponse(201, pressRelease));
});

export const updatePressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pressRelease = await PressRelease.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
    );

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    return res.json(new ApiResponse(200, pressRelease));
});

export const deletePressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pressRelease = await PressRelease.findByIdAndDelete(req.params.id);
    
    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    return res.json(new ApiResponse(200, { message: 'Press release deleted successfully' }));
});

export const getPublishers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const publishers = await Publisher.find();
    return res.json(new ApiResponse(200, publishers));
});

export const getPublisherDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const publisher = await Publisher.findOne({ publisherId: req.params.id });
    
    if (!publisher) {
        throw new ApiError(404, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher));
});

// Add to cart
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;

    const { publisherId } = req.body;

    // Find the publisher
    const publisher = await Publisher.findOne({ publisherId });
    if (!publisher) {
        throw new ApiError(404, 'Publisher not found');
    }

    // Add or update cart item with all publisher details
    const cartItem = {
        publisherId: publisher.publisherId,
        name: publisher.name,
        price: publisher.price,
        region_reach: publisher.region_reach || [],
        audience_reach: publisher.audience_reach,
        selected: true
    };

    // Find existing cart or create new one
    let cart = await Cart.findOneAndUpdate(
        { user_id: userId },
        { 
            $addToSet: { items: cartItem },
            updated_at: new Date()
        },
        { upsert: true, new: true }
    );

    return res.json(new ApiResponse(200, cart));
});

// Get cart items
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;

    const cart = await Cart.findOne({ user_id: userId });
    
    let cartResponse;
    if (cart && cart.items.length > 0) {
        // Fetch publisher data for each item to get the latest region_reach and audience_reach
        const enrichedItems = await Promise.all(
            cart.items.map(async (item) => {
                try {
                    const publisher = await Publisher.findOne({ publisherId: item.publisherId });

                    if (!publisher) {
                        console.warn(`Publisher not found for publisherId: ${item.publisherId}`);
                    }

                    return {
                        publisherId: item.publisherId,
                        name: item.name,
                        price: item.price,
                        selected: item.selected,
                        region_reach: publisher?.region_reach || item.region_reach || [],
                        audience_reach: publisher?.audience_reach || item.audience_reach || 'N/A'
                    };
                } catch (error) {
                    console.error(`Error fetching publisher data for publisherId: ${item.publisherId}`, error);
                    return {
                        publisherId: item.publisherId,
                        name: item.name,
                        price: item.price,
                        selected: item.selected,
                        region_reach: item.region_reach || [],
                        audience_reach: item.audience_reach || 'N/A'
                    };
                }
            })
        );

        cartResponse = {
            _id: cart._id,
            user_id: cart.user_id,
            items: enrichedItems,
            audience: cart.audience || null,
            location: cart.location || null,
            created_at: cart.created_at,
            updated_at: cart.updated_at
        };
    } else {
        cartResponse = {
            items: [],
            audience: null,
            location: null
        };
    }
    
    return res.json(new ApiResponse(200, cartResponse));
});


export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id || !req.user.email) {
        throw new ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const userEmail = req.user.email;

    // Get user's cart
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'Cart is empty');
    }

    // Calculate order summary
    const subtotal = cart.items.reduce((acc: number, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
        return acc + price;
    }, 0);

    const vat_percentage = '7.5%';
    const vat_amount = subtotal * 0.075;
    const total_amount = subtotal + vat_amount;

    // Generate unique reference for Paystack
    const reference = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // Create the order with 'Pending' status
    const order = await Order.create({
        user_id: userId,
        items: cart.items,
        order_summary: {
            subtotal: `₦${subtotal.toLocaleString()}`,
            vat_percentage,
            vat_amount: `₦${vat_amount.toLocaleString()}`,
            total_amount: `₦${total_amount.toLocaleString()}`
        },
        payment_method: 'Paystack',
        status: 'Pending',
        reference,
        created_at: new Date()
    });

    // Record payment_pending step for each publication in the order
    for (const item of cart.items) {
        // Note: We don't have PR ID yet at order stage, so we'll record this when payment completes
    }

    // Initialize Paystack payment (cart will be cleared only after payment verification)
    const paystackResponse = await initializePaystackPayment({
        amount: total_amount * 100, // Paystack expects amount in kobo
        email: userEmail,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/pr/payment/callback`
    });

    return res.json(new ApiResponse(201, {
        order,
        payment: paystackResponse,
        message: 'Proceed to complete payment. Cart will be cleared after successful payment verification.'
    }));
});

export const createPublisher = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    console.log('Create Publisher - Request Body:', req.body);
    const { 
        name, 
        description, 
        website, 
        turnaroundTime, 
        industry_focus, 
        region_reach, 
        audienceReach, 
        price, 
        isPopular, 
        isSelected,
        avg_publish_time,
        key_features,
        metrics
    } = req.body;

    const publisher = await Publisher.create({
        publisherId: `PUB${Date.now()}`, // Always generate unique ID, ignore any provided ID
        name,
        description,
        website,
        avg_publish_time: avg_publish_time || turnaroundTime,
        industry_focus: industry_focus || [],
        region_reach: region_reach || [],
        audience_reach: audienceReach,
        price,
        isPopular: isPopular || false,
        isSelected: isSelected || false,
        key_features: key_features || [],
        metrics: metrics || {
            domain_authority: 0,
            trust_score: 0,
            avg_traffic: 0,
            social_signals: 0
        },
        created_by: userId,
        created_at: new Date().toISOString()
    });

    return res.status(201).json(new ApiResponse(201, publisher, 'Publisher created successfully'));
});

// Update cart item (select/deselect)
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const { selected } = req.body;

    const cart = await Cart.findOneAndUpdate(
        { 
            user_id: userId,
            'items.publisherId': publisherId 
        },
        { 
            $set: { 
                'items.$.selected': selected,
                updated_at: new Date()
            } 
        },
        { new: true }
    );

    if (!cart) {
        throw new ApiError(404, 'Cart item not found');
    }

    return res.json(new ApiResponse(200, cart));
});

// Remove item from cart
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;

    const cart = await Cart.findOneAndUpdate(
        { user_id: userId },
        { 
            $pull: { items: { publisherId } },
            $set: { updated_at: new Date() }
        },
        { new: true }
    );

    if (!cart) {
        throw new ApiError(404, 'Cart not found');
    }

    return res.json(new ApiResponse(200, cart));
});

export const getOrderDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return res.json(new ApiResponse(200, order));
});

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, 'Unauthorized');
    }

    const { reference } = req.query;

    if (!reference || typeof reference !== 'string') {
        throw new ApiError(400, 'Payment reference is required');
    }

    // Verify payment with Paystack
    const paymentData = await verifyPaystackPayment(reference);

    if (!paymentData || paymentData.status !== 'success') {
        throw new ApiError(400, 'Payment verification failed or payment was not successful');
    }

    // Update order status to 'Completed'
    const order = await Order.findOneAndUpdate(
        { reference, user_id: req.user._id },
        { $set: { status: 'Completed' } },
        { new: true }
    );

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    // Clear the cart after successful payment verification
    await Cart.findOneAndUpdate(
        { user_id: req.user._id },
        { $set: { items: [] } }
    );

    return res.json(new ApiResponse(200, {
        order,
        message: 'Payment verified successfully. Cart has been cleared.'
    }));
});

/**
 * Paystack Webhook - Called by Paystack server when payment is completed
 * This endpoint is PUBLIC but secured by Paystack signature verification
 * 
 * Setup: Configure in Paystack dashboard:
 * - URL: https://yourdomain.com/api/v1/press-releases/webhooks/paystack
 * - Events: charge.success
 */
export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-paystack-signature'] as string;
    const body = req.body;

    // Verify Paystack signature for security
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return res.status(500).json(new ApiResponse(500, null, 'Webhook not configured'));
    }

    const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('hex');

    if (hash !== signature) {
        console.warn('Invalid Paystack signature attempt');
        return res.status(401).json(new ApiResponse(401, null, 'Invalid signature'));
    }

    // Only process successful charges
    if (body.event !== 'charge.success') {
        return res.json(new ApiResponse(200, { message: 'Event ignored', event: body.event }));
    }

    const reference = body.data?.reference;
    
    if (!reference) {
        console.warn('No reference in webhook payload');
        return res.status(400).json(new ApiResponse(400, null, 'No reference provided'));
    }

    try {
        // Find order by reference
        const order = await Order.findOne({ reference });

        if (!order) {
            console.warn(`Order not found for reference: ${reference}`);
            // Still return 200 OK to acknowledge webhook (Paystack will stop retrying)
            return res.json(new ApiResponse(200, { message: 'Order not found', reference }));
        }

        // Check if already processed (idempotency)
        if (order.status === 'Completed') {
            console.log(`Order ${reference} already completed, skipping duplicate webhook`);
            return res.json(new ApiResponse(200, { message: 'Order already completed', reference }));
        }

        // Update order status to 'Completed'
        order.status = 'Completed';
        order.payment_status = 'Successful';
        await order.save();

        // Record payment_completed step for all press releases (if they exist)
        // Note: In a typical workflow, the press release would be created before payment
        const pressReleases = await PressRelease.find({ user_id: order.user_id });
        for (const pr of pressReleases) {
            await recordProgressStep(
                pr._id,
                order.user_id,
                'payment_completed',
                `Payment completed for press release distribution`,
                { payment_reference: reference, order_id: String(order._id) }
            );
        }

        // Clear the user's cart
        const cartUpdate = await Cart.findOneAndUpdate(
            { user_id: order.user_id },
            { $set: { items: [] } },
            { new: true }
        );

        console.log(`✅ Payment verified via webhook for order: ${reference}`);
        console.log(`   User: ${order.user_id}, Cart cleared, Items: ${order.items.length}`);

        return res.json(new ApiResponse(200, {
            message: 'Webhook processed successfully',
            reference,
            order_id: order._id,
            timestamp: new Date()
        }));
    } catch (error) {
        console.error(`❌ Webhook processing error for ${reference}:`, error);
        // Return 200 to acknowledge we received it, but log the error
        return res.json(new ApiResponse(500, null, 'Webhook processing failed'));
    }
});

// Status configuration for the progress tracker
const STATUS_CONFIG = {
    completed: {
        icon: 'CheckCircle',
        color: '#10b981',
        textColor: '#065f46'
    },
    pending: {
        icon: 'Clock',
        color: '#f59e0b',
        textColor: '#92400e'
    },
    processing: {
        icon: 'Loader',
        color: '#3b82f6',
        textColor: '#1e40af'
    },
    review: {
        icon: 'Eye',
        color: '#8b5cf6',
        textColor: '#5b21b6'
    },
    rejected: {
        icon: 'XCircle',
        color: '#ef4444',
        textColor: '#991b1b'
    }
};

// Get press release tracker
export const getPressReleaseTracker = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const { prId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(prId)) {
        throw new ApiError(400, 'Invalid press release ID');
    }

    const pressRelease = await PressRelease.findOne({
        _id: prId,
        user_id: userId
    }) as any;

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Initialize tracker if it doesn't exist
    if (!pressRelease.tracker) {
        pressRelease.tracker = {
            current_status: 'pending',
            status_history: [{
                status: 'pending',
                timestamp: new Date(),
                notes: 'Press release created'
            }],
            progress_percentage: 0,
            estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            reviewers_count: 0
        };
        await pressRelease.save();
    }

    // Build the tracker response with proper typing
    const estimatedCompletion = pressRelease.tracker.estimated_completion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tracker: PressReleaseTracker = {
        _id: String(pressRelease._id),
        pr_id: String(pressRelease._id),
        title: pressRelease.title,
        current_status: pressRelease.tracker.current_status as any,
        status_history: pressRelease.tracker.status_history.map((h: any) => ({
            status: h.status as any,
            timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
            notes: h.notes
        })),
        progress_percentage: pressRelease.tracker.progress_percentage,
        estimated_completion: estimatedCompletion.toISOString(),
        actual_completion: pressRelease.tracker.actual_completion ? new Date(pressRelease.tracker.actual_completion).toISOString() : undefined,
        reviewers_count: pressRelease.tracker.reviewers_count,
        distribution_outlets: pressRelease.distribution_report.length,
        current_step: Math.floor(pressRelease.tracker.progress_percentage / 20) + 1,
        total_steps: 5
    };

    // Build timeline from status history
    const timeline = pressRelease.tracker.status_history.map((h: any) => ({
        status: h.status as any,
        date: (h.timestamp ? new Date(h.timestamp) : new Date()).toISOString().split('T')[0],
        description: `Status changed to ${h.status}${h.notes ? ': ' + h.notes : ''}`
    }));

    const response: ProgressTrackerResponse = {
        tracker,
        status_config: STATUS_CONFIG,
        timeline
    };

    return res.json(new ApiResponse(200, response));
});

// Update press release tracker status
export const updatePressReleaseTrackerStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const { prId } = req.params;
    const { current_status, notes, progress_percentage, reviewers_count } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(prId)) {
        throw new ApiError(400, 'Invalid press release ID');
    }

    // Validate status
    const validStatuses = ['completed', 'pending', 'processing', 'review', 'rejected'];
    if (!validStatuses.includes(current_status)) {
        throw new ApiError(400, 'Invalid status value');
    }

    const pressRelease = await PressRelease.findOne({
        _id: prId,
        user_id: userId
    }) as any;

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Initialize tracker if it doesn't exist
    if (!pressRelease.tracker) {
        pressRelease.tracker = {
            current_status: 'pending',
            status_history: [],
            progress_percentage: 0,
            estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            reviewers_count: 0
        };
    }

    // Ensure estimated_completion has a value
    if (!pressRelease.tracker.estimated_completion) {
        pressRelease.tracker.estimated_completion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Update tracker
    pressRelease.tracker.current_status = current_status;
    pressRelease.tracker.status_history.push({
        status: current_status,
        timestamp: new Date(),
        notes
    });

    if (progress_percentage !== undefined) {
        pressRelease.tracker.progress_percentage = Math.min(100, Math.max(0, progress_percentage));
    }

    if (reviewers_count !== undefined) {
        pressRelease.tracker.reviewers_count = reviewers_count;
    }

    // If status is completed, set actual_completion time
    if (current_status === 'completed') {
        pressRelease.tracker.actual_completion = new Date();
        pressRelease.tracker.progress_percentage = 100;
    }

    await pressRelease.save();

    // Build response with proper null checks
    const updatedEstimatedCompletion = pressRelease.tracker.estimated_completion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tracker: PressReleaseTracker = {
        _id: String(pressRelease._id),
        pr_id: String(pressRelease._id),
        title: pressRelease.title,
        current_status: pressRelease.tracker.current_status as any,
        status_history: pressRelease.tracker.status_history.map((h: any) => ({
            status: h.status as any,
            timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
            notes: h.notes
        })),
        progress_percentage: pressRelease.tracker.progress_percentage,
        estimated_completion: updatedEstimatedCompletion.toISOString(),
        actual_completion: pressRelease.tracker.actual_completion ? new Date(pressRelease.tracker.actual_completion).toISOString() : undefined,
        reviewers_count: pressRelease.tracker.reviewers_count,
        distribution_outlets: pressRelease.distribution_report.length,
        current_step: Math.floor(pressRelease.tracker.progress_percentage / 20) + 1,
        total_steps: 5
    };

    return res.json(new ApiResponse(200, {
        message: 'Tracker updated successfully',
        tracker
    }));
});

// Get all press releases with tracker information
export const getPressReleasesWithTracker = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const pressReleases = await PressRelease.find({ user_id: userId })
        .sort({ createdAt: -1 });

    const trackerList = pressReleases.map(pr => {
        const tracker = pr.tracker || {
            current_status: 'pending',
            status_history: [],
            progress_percentage: 0,
            estimated_completion: new Date(),
            reviewers_count: 0
        };

        return {
            _id: pr._id,
            title: pr.title,
            status: pr.status,
            tracker_status: tracker.current_status,
            progress_percentage: tracker.progress_percentage,
            current_step: Math.floor(tracker.progress_percentage / 20) + 1,
            total_steps: 5
        };
    });

    return res.json(new ApiResponse(200, {
        status_config: STATUS_CONFIG,
        trackers: trackerList
    }));
});

/**
 * Get detailed progress timeline for a press release
 * Shows all steps: initiated, payment_pending, payment_completed, under_review, approved/rejected
 */
export const getPressReleaseProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const { prId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(prId)) {
        throw new ApiError(400, 'Invalid press release ID');
    }

    // Verify the press release belongs to the user
    const pressRelease = await PressRelease.findOne({
        _id: prId,
        user_id: userId
    });

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Get the progress timeline
    const progress = await getProgressTimeline(
        new mongoose.Types.ObjectId(prId),
        userId
    );

    // If no progress record found, create a draft response
    if (!progress) {
        console.log(`📋 No progress found for PR: ${prId}. Returning draft status.`);
        return res.json(new ApiResponse(200, {
            press_release: {
                _id: pressRelease._id,
                title: pressRelease.title,
                status: pressRelease.status
            },
            progress: {
                current_step: 'initiated',
                initiated_at: new Date(pressRelease.date_created),
                payment_completed_at: null,
                under_review_at: null,
                completed_at: null,
                rejected_at: null,
                rejection_reason: null
            },
            timeline: [
                {
                    step: 'initiated',
                    timestamp: new Date(pressRelease.date_created),
                    notes: 'Draft saved. Complete payment to continue distribution.'
                }
            ],
            message: 'Draft is saved. Complete payment to continue.',
            status_message: 'Draft - Ready for payment',
            next_action: 'Complete payment for distribution'
        }));
    }

    // Format the response
    const response = {
        press_release: {
            _id: pressRelease._id,
            title: pressRelease.title,
            status: pressRelease.status
        },
        progress: {
            current_step: progress.current_step,
            initiated_at: progress.initiated_at,
            payment_completed_at: progress.payment_completed_at,
            under_review_at: progress.under_review_at,
            completed_at: progress.completed_at,
            rejected_at: progress.rejected_at,
            rejection_reason: progress.rejection_reason
        },
        timeline: progress.progress_history.map((record: any) => ({
            step: record.step,
            timestamp: record.timestamp,
            notes: record.notes,
            metadata: record.metadata
        })),
        step_descriptions: {
            'initiated': 'Press release created and initiated',
            'payment_pending': 'Awaiting payment for distribution',
            'payment_completed': 'Payment received successfully',
            'under_review': 'Press release under editorial review',
            'approved': 'Press release approved and published',
            'rejected': 'Press release rejected'
        }
    };

    return res.json(new ApiResponse(200, response));
});

/**
 * Update press release status to under_review (called by admin when reviewing)
 */
export const updatePressReleaseToUnderReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prId } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(prId)) {
        throw new ApiError(400, 'Invalid press release ID');
    }

    const pressRelease = await PressRelease.findByIdAndUpdate(
        prId,
        { 
            $set: { 
                status: 'Pending',
                'tracker.current_status': 'review',
                'tracker.progress_percentage': 50
            }
        },
        { new: true }
    );

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Record the step for all users' press releases in DB
    const prObjectId = new mongoose.Types.ObjectId(prId);
    const progressRecords = await PressReleaseProgress.find({ press_release_id: prObjectId });

    for (const record of progressRecords) {
        await recordProgressStep(
            prObjectId,
            record.user_id,
            'under_review',
            notes || 'Press release submitted for editorial review'
        );
    }

    return res.json(new ApiResponse(200, {
        message: 'Press release status updated to under review',
        press_release: pressRelease
    }));
});

/**
 * Approve a press release (called by admin)
 */
export const approvePressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prId } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(prId)) {
        throw new ApiError(400, 'Invalid press release ID');
    }

    const pressRelease = await PressRelease.findByIdAndUpdate(
        prId,
        {
            $set: {
                status: 'Published',
                'tracker.current_status': 'completed',
                'tracker.progress_percentage': 100,
                'tracker.actual_completion': new Date()
            }
        },
        { new: true }
    );

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Record the approval step
    const prObjectId = new mongoose.Types.ObjectId(prId);
    const progressRecords = await PressReleaseProgress.find({ press_release_id: prObjectId });

    for (const record of progressRecords) {
        await recordProgressStep(
            prObjectId,
            record.user_id,
            'approved',
            notes || 'Press release approved and published',
            { approved_at: new Date() }
        );
    }

    return res.json(new ApiResponse(200, {
        message: 'Press release approved and published',
        press_release: pressRelease
    }));
});

/**
 * Reject a press release (called by admin)
 */
export const rejectPressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { prId } = req.params;
    const { rejection_reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(prId)) {
        throw new ApiError(400, 'Invalid press release ID');
    }

    if (!rejection_reason) {
        throw new ApiError(400, 'Rejection reason is required');
    }

    const pressRelease = await PressRelease.findByIdAndUpdate(
        prId,
        {
            $set: {
                status: 'Draft',
                'tracker.current_status': 'rejected',
                'tracker.progress_percentage': 0,
                'tracker.actual_completion': new Date()
            }
        },
        { new: true }
    );

    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
    }

    // Record the rejection step
    const prObjectId = new mongoose.Types.ObjectId(prId);
    const progressRecords = await PressReleaseProgress.find({ press_release_id: prObjectId });

    for (const record of progressRecords) {
        await recordProgressStep(
            prObjectId,
            record.user_id,
            'rejected',
            rejection_reason,
            { rejection_reason, rejected_at: new Date() }
        );
    }

    return res.json(new ApiResponse(200, {
        message: 'Press release rejected',
        press_release: pressRelease,
        rejection_reason
    }));
});

/**
 * Get all press releases with full progress details
 */
export const getAllPressReleasesWithProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const pressReleases = await PressRelease.find({ user_id: userId })
        .sort({ createdAt: -1 });

    const progressList = await Promise.all(
        pressReleases.map(async (pr) => {
            const progress = await getProgressTimeline(
                pr._id,
                userId
            );

            const currentStep = progress?.current_step || 'initiated';
            
            // Determine status message based on current step
            let status_message = '';
            let next_action = '';
            
            if (!progress) {
                status_message = 'Draft - Ready for payment';
                next_action = 'Complete payment to continue distribution';
            } else {
                switch (currentStep) {
                    case 'initiated':
                        status_message = 'Draft - Ready for payment';
                        next_action = 'Complete payment to continue distribution';
                        break;
                    case 'payment_completed':
                        status_message = 'Payment received - Awaiting review';
                        next_action = 'Waiting for admin review';
                        break;
                    case 'under_review':
                        status_message = 'Under review';
                        next_action = 'Pending admin decision';
                        break;
                    case 'approved':
                        status_message = 'Published';
                        next_action = 'Successfully distributed';
                        break;
                    case 'rejected':
                        status_message = 'Rejected - Needs revision';
                        next_action = `Reason: ${progress?.rejection_reason || 'See details for more info'}`;
                        break;
                    default:
                        status_message = currentStep;
                        next_action = 'Check details';
                }
            }

            return {
                _id: pr._id,
                title: pr.title,
                status: pr.status,
                date_created: pr.date_created,
                current_step: currentStep,
                initiated_at: progress?.initiated_at || new Date(pr.date_created),
                payment_completed_at: progress?.payment_completed_at,
                under_review_at: progress?.under_review_at,
                completed_at: progress?.completed_at,
                rejected_at: progress?.rejected_at,
                rejection_reason: progress?.rejection_reason,
                total_steps_completed: progress?.progress_history.length || 1,
                status_message,
                next_action
            };
        })
    );

    return res.json(new ApiResponse(200, {
        total: progressList.length,
        press_releases: progressList
    }));
});