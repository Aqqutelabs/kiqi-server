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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackWebhook = exports.verifyPayment = exports.getOrderDetails = exports.removeFromCart = exports.updateCartItem = exports.createPublisher = exports.createOrder = exports.getCart = exports.addToCart = exports.getPublisherDetails = exports.getPublishers = exports.deletePressRelease = exports.updatePressRelease = exports.createPressRelease = exports.getPressReleaseDetails = exports.getDashboardMetrics = exports.getPressReleasesList = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const PressRelease_1 = require("../models/PressRelease");
const Publisher_1 = require("../models/Publisher");
const Order_1 = require("../models/Order");
const Cart_1 = require("../models/Cart");
const paystack_1 = require("../utils/paystack");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("cloudinary");
const crypto_1 = require("crypto");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: 'dphdvbdwg',
    api_key: '164375779418948',
    api_secret: 'otQq6cFFzqGeQO4umSVrrFumA30' // Replace with your actual API secret
});
exports.getPressReleasesList = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId })
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
    return res.json(new ApiResponse_1.ApiResponse(200, pr_list));
}));
exports.getDashboardMetrics = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const pressReleases = yield PressRelease_1.PressRelease.find({ user_id: userId });
    const orders = yield Order_1.Order.find({ user_id: userId });
    const total_press_releases = pressReleases.length;
    const total_views = pressReleases.reduce((acc, pr) => acc + pr.metrics.total_views, 0);
    const total_spent = orders.reduce((acc, order) => {
        const amount = parseFloat(order.order_summary.total_amount.replace(/[^0-9.-]+/g, ''));
        return acc + amount;
    }, 0);
    const total_channels = new Set(pressReleases.flatMap(pr => pr.distribution_report.map(dr => dr.outlet_name))).size;
    const pr_list = pressReleases.map(pr => ({
        title: pr.title,
        status: pr.status,
        distribution: pr.distribution,
        campaign: pr.campaign,
        performance_views: pr.performance_views,
        date_created: pr.date_created
    }));
    return res.json(new ApiResponse_1.ApiResponse(200, {
        total_press_releases,
        total_views: `${(total_views / 1000).toFixed(1)}K`,
        total_spent: `₦${total_spent.toLocaleString()}`,
        total_channels,
        pr_list
    }));
}));
exports.getPressReleaseDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pressRelease = yield PressRelease_1.PressRelease.findById(req.params.id);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    // Ensure response includes all fields including title
    const responseData = Object.assign(Object.assign({}, pressRelease.toObject()), { title: pressRelease.title });
    return res.json(new ApiResponse_1.ApiResponse(200, responseData));
}));
exports.createPressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Request body:', req.body);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { campaign_id, campaign, pr_content, status, title, distribution, performance_views } = req.body;
    let imageUrl = '';
    // Handle image upload to Cloudinary
    if (req.file) {
        try {
            const uploadResult = yield cloudinary_1.v2.uploader.upload(req.file.path, {
                folder: 'press_releases',
                public_id: `${userId}_${Date.now()}`
            });
            imageUrl = uploadResult.secure_url;
        }
        catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new ApiError_1.ApiError(500, 'Failed to upload image');
        }
    }
    const pressRelease = yield PressRelease_1.PressRelease.create({
        campaign_id: campaign_id ? new mongoose_1.default.Types.ObjectId(campaign_id) : undefined,
        campaign: campaign || title || '', // prefer explicit campaign, fallback to title
        title: title || '',
        content: pr_content,
        status,
        distribution: distribution || '',
        performance_views: performance_views || '0',
        image: imageUrl, // Store the Cloudinary image URL
        user_id: userId, // userId is already checked above
        date_created: new Date().toISOString(),
        metrics: {
            total_views: 0,
            total_clicks: 0,
            engagement_rate: '0%',
            avg_time_on_page: '0:00'
        }
    });
    return res.json(new ApiResponse_1.ApiResponse(201, pressRelease));
}));
exports.updatePressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, pressRelease));
}));
exports.deletePressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pressRelease = yield PressRelease_1.PressRelease.findByIdAndDelete(req.params.id);
    if (!pressRelease) {
        throw new ApiError_1.ApiError(404, 'Press release not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Press release deleted successfully' }));
}));
exports.getPublishers = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const publishers = yield Publisher_1.Publisher.find();
    return res.json(new ApiResponse_1.ApiResponse(200, publishers));
}));
exports.getPublisherDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const publisher = yield Publisher_1.Publisher.findOne({ publisherId: req.params.id });
    if (!publisher) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, publisher));
}));
// Add to cart
exports.addToCart = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.body;
    // Find the publisher
    const publisher = yield Publisher_1.Publisher.findOne({ publisherId });
    if (!publisher) {
        throw new ApiError_1.ApiError(404, 'Publisher not found');
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
    let cart = yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, {
        $addToSet: { items: cartItem },
        updated_at: new Date()
    }, { upsert: true, new: true });
    return res.json(new ApiResponse_1.ApiResponse(200, cart));
}));
// Get cart items
exports.getCart = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const cart = yield Cart_1.Cart.findOne({ user_id: userId });
    let cartResponse;
    if (cart && cart.items.length > 0) {
        // Fetch publisher data for each item to get the latest region_reach and audience_reach
        const enrichedItems = yield Promise.all(cart.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const publisher = yield Publisher_1.Publisher.findOne({ publisherId: item.publisherId });
                if (!publisher) {
                    console.warn(`Publisher not found for publisherId: ${item.publisherId}`);
                }
                return {
                    publisherId: item.publisherId,
                    name: item.name,
                    price: item.price,
                    selected: item.selected,
                    region_reach: (publisher === null || publisher === void 0 ? void 0 : publisher.region_reach) || item.region_reach || [],
                    audience_reach: (publisher === null || publisher === void 0 ? void 0 : publisher.audience_reach) || item.audience_reach || 'N/A'
                };
            }
            catch (error) {
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
        })));
        cartResponse = {
            _id: cart._id,
            user_id: cart.user_id,
            items: enrichedItems,
            audience: cart.audience || null,
            location: cart.location || null,
            created_at: cart.created_at,
            updated_at: cart.updated_at
        };
    }
    else {
        cartResponse = {
            items: [],
            audience: null,
            location: null
        };
    }
    return res.json(new ApiResponse_1.ApiResponse(200, cartResponse));
}));
exports.createOrder = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id || !req.user.email) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const userEmail = req.user.email;
    // Get user's cart
    const cart = yield Cart_1.Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
        throw new ApiError_1.ApiError(400, 'Cart is empty');
    }
    // Calculate order summary
    const subtotal = cart.items.reduce((acc, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
        return acc + price;
    }, 0);
    const vat_percentage = '7.5%';
    const vat_amount = subtotal * 0.075;
    const total_amount = subtotal + vat_amount;
    // Generate unique reference for Paystack
    const reference = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    // Create the order with 'Pending' status
    const order = yield Order_1.Order.create({
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
    // Initialize Paystack payment (cart will be cleared only after payment verification)
    const paystackResponse = yield (0, paystack_1.initializePaystackPayment)({
        amount: total_amount * 100, // Paystack expects amount in kobo
        email: userEmail,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/pr/payment/callback`
    });
    return res.json(new ApiResponse_1.ApiResponse(201, {
        order,
        payment: paystackResponse,
        message: 'Proceed to complete payment. Cart will be cleared after successful payment verification.'
    }));
}));
exports.createPublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    console.log('Create Publisher - Request Body:', req.body);
    const { name, description, website, turnaroundTime, industry_focus, region_reach, audienceReach, price, isPopular, isSelected, avg_publish_time, key_features, metrics } = req.body;
    const publisher = yield Publisher_1.Publisher.create({
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
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, publisher, 'Publisher created successfully'));
}));
// Update cart item (select/deselect)
exports.updateCartItem = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const { selected } = req.body;
    const cart = yield Cart_1.Cart.findOneAndUpdate({
        user_id: userId,
        'items.publisherId': publisherId
    }, {
        $set: {
            'items.$.selected': selected,
            updated_at: new Date()
        }
    }, { new: true });
    if (!cart) {
        throw new ApiError_1.ApiError(404, 'Cart item not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, cart));
}));
// Remove item from cart
exports.removeFromCart = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const userId = req.user._id;
    const { publisherId } = req.params;
    const cart = yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, {
        $pull: { items: { publisherId } },
        $set: { updated_at: new Date() }
    }, { new: true });
    if (!cart) {
        throw new ApiError_1.ApiError(404, 'Cart not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, cart));
}));
exports.getOrderDetails = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield Order_1.Order.findById(req.params.id);
    if (!order) {
        throw new ApiError_1.ApiError(404, 'Order not found');
    }
    return res.json(new ApiResponse_1.ApiResponse(200, order));
}));
exports.verifyPayment = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const { reference } = req.query;
    if (!reference || typeof reference !== 'string') {
        throw new ApiError_1.ApiError(400, 'Payment reference is required');
    }
    // Verify payment with Paystack
    const paymentData = yield (0, paystack_1.verifyPaystackPayment)(reference);
    if (!paymentData || paymentData.status !== 'success') {
        throw new ApiError_1.ApiError(400, 'Payment verification failed or payment was not successful');
    }
    // Update order status to 'Completed'
    const order = yield Order_1.Order.findOneAndUpdate({ reference, user_id: req.user._id }, { $set: { status: 'Completed' } }, { new: true });
    if (!order) {
        throw new ApiError_1.ApiError(404, 'Order not found');
    }
    // Clear the cart after successful payment verification
    yield Cart_1.Cart.findOneAndUpdate({ user_id: req.user._id }, { $set: { items: [] } });
    return res.json(new ApiResponse_1.ApiResponse(200, {
        order,
        message: 'Payment verified successfully. Cart has been cleared.'
    }));
}));
/**
 * Paystack Webhook - Called by Paystack server when payment is completed
 * This endpoint is PUBLIC but secured by Paystack signature verification
 *
 * Setup: Configure in Paystack dashboard:
 * - URL: https://yourdomain.com/api/v1/press-releases/webhooks/paystack
 * - Events: charge.success
 */
exports.paystackWebhook = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const signature = req.headers['x-paystack-signature'];
    const body = req.body;
    // Verify Paystack signature for security
    if (!process.env.PAYSTACK_SECRET_KEY) {
        console.error('PAYSTACK_SECRET_KEY not configured');
        return res.status(500).json(new ApiResponse_1.ApiResponse(500, null, 'Webhook not configured'));
    }
    const hash = (0, crypto_1.createHmac)('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('hex');
    if (hash !== signature) {
        console.warn('Invalid Paystack signature attempt');
        return res.status(401).json(new ApiResponse_1.ApiResponse(401, null, 'Invalid signature'));
    }
    // Only process successful charges
    if (body.event !== 'charge.success') {
        return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Event ignored', event: body.event }));
    }
    const reference = (_a = body.data) === null || _a === void 0 ? void 0 : _a.reference;
    if (!reference) {
        console.warn('No reference in webhook payload');
        return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, 'No reference provided'));
    }
    try {
        // Find order by reference
        const order = yield Order_1.Order.findOne({ reference });
        if (!order) {
            console.warn(`Order not found for reference: ${reference}`);
            // Still return 200 OK to acknowledge webhook (Paystack will stop retrying)
            return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Order not found', reference }));
        }
        // Check if already processed (idempotency)
        if (order.status === 'Completed') {
            console.log(`Order ${reference} already completed, skipping duplicate webhook`);
            return res.json(new ApiResponse_1.ApiResponse(200, { message: 'Order already completed', reference }));
        }
        // Update order status to 'Completed'
        order.status = 'Completed';
        order.payment_status = 'Successful';
        yield order.save();
        // Clear the user's cart
        const cartUpdate = yield Cart_1.Cart.findOneAndUpdate({ user_id: order.user_id }, { $set: { items: [] } }, { new: true });
        console.log(`✅ Payment verified via webhook for order: ${reference}`);
        console.log(`   User: ${order.user_id}, Cart cleared, Items: ${order.items.length}`);
        return res.json(new ApiResponse_1.ApiResponse(200, {
            message: 'Webhook processed successfully',
            reference,
            order_id: order._id,
            timestamp: new Date()
        }));
    }
    catch (error) {
        console.error(`❌ Webhook processing error for ${reference}:`, error);
        // Return 200 to acknowledge we received it, but log the error
        return res.json(new ApiResponse_1.ApiResponse(500, null, 'Webhook processing failed'));
    }
}));
