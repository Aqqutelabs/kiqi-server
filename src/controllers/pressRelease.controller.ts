import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { PressRelease } from '../models/PressRelease';
import { Publisher } from '../models/Publisher';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { initializePaystackPayment, verifyPaystackPayment } from '../utils/paystack';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import { CheckoutPublicationItem } from '../types/pressRelease.types';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: 'dphdvbdwg', 
    api_key: '164375779418948', 
    api_secret: 'otQq6cFFzqGeQO4umSVrrFumA30' // Replace with your actual API secret
});

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

export const getPressReleaseDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pressRelease = await PressRelease.findById(req.params.id);
    if (!pressRelease) {
        throw new ApiError(404, 'Press release not found');
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
    const { campaign_id, campaign, pr_content, status, title, distribution, performance_views } = req.body;

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
        campaign_id: campaign_id ? new mongoose.Types.ObjectId(campaign_id) : undefined,
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

    // Add or update cart item
    const cartItem = {
        publisherId: publisher.publisherId,
        name: publisher.name,
        price: publisher.price,
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
    return res.json(new ApiResponse(200, cart || { items: [] }));
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

    // Create the order
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

    // Clear the cart after creating order
    await Cart.findOneAndUpdate(
        { user_id: userId },
        { $set: { items: [] } }
    );

    // Initialize Paystack payment
    const paystackResponse = await initializePaystackPayment({
        amount: total_amount * 100, // Paystack expects amount in kobo
        email: userEmail,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`
    });

    return res.json(new ApiResponse(201, {
        order,
        payment: paystackResponse
    }));
});

export const createPublisher = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    console.log('Create Publisher - Request Body:', req.body);
    const { name, description, website, turnaroundTime, industryFocus, region, audienceReach, price, isPopular, isSelected } = req.body;

    const publisher = await Publisher.create({
        publisherId: `PUB${Date.now()}`, // Generate a unique publisher ID
        name,
        description,
        website,
        avg_publish_time: turnaroundTime,
        industry_focus: industryFocus,
        region_reach: region,
        audience_reach: audienceReach,
        price,
        isPopular: isPopular || false,
        isSelected: isSelected || false,
        key_features: [], // Add default empty array or get from req.body
        metrics: {
            social_signals: req.body.metrics?.social_signals || 0,
            avg_traffic: req.body.metrics?.avg_traffic || 0,
            trust_score: req.body.metrics?.trust_score || 0,
            domain_authority: req.body.metrics?.domain_authority || 0
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