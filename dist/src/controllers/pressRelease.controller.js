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
exports.getOrderDetails = exports.removeFromCart = exports.updateCartItem = exports.createPublisher = exports.createOrder = exports.getCart = exports.addToCart = exports.getPublisherDetails = exports.getPublishers = exports.deletePressRelease = exports.updatePressRelease = exports.createPressRelease = exports.getPressReleaseDetails = exports.getDashboardMetrics = exports.getPressReleasesList = void 0;
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
        .select('title status distribution campaign performance_views date_created');
    const pr_list = pressReleases.map(pr => ({
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
    return res.json(new ApiResponse_1.ApiResponse(200, pressRelease));
}));
exports.createPressRelease = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Request body:', req.body);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    const { campaign_id, campaign, pr_content, status } = req.body;
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
        campaign_id: new mongoose_1.default.Types.ObjectId(campaign_id),
        campaign, // Add the campaign name
        content: pr_content,
        status,
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
    // Add or update cart item
    const cartItem = {
        publisherId: publisher.publisherId,
        name: publisher.name,
        price: publisher.price,
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
    return res.json(new ApiResponse_1.ApiResponse(200, cart || { items: [] }));
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
    // Create the order
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
    // Clear the cart after creating order
    yield Cart_1.Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });
    // Initialize Paystack payment
    const paystackResponse = yield (0, paystack_1.initializePaystackPayment)({
        amount: total_amount * 100, // Paystack expects amount in kobo
        email: userEmail,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`
    });
    return res.json(new ApiResponse_1.ApiResponse(201, {
        order,
        payment: paystackResponse
    }));
}));
exports.createPublisher = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    console.log('Create Publisher - Request Body:', req.body);
    const { name, description, website, turnaroundTime, industryFocus, region, audienceReach, price, isPopular, isSelected } = req.body;
    const publisher = yield Publisher_1.Publisher.create({
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
            social_signals: ((_b = req.body.metrics) === null || _b === void 0 ? void 0 : _b.social_signals) || 0,
            avg_traffic: ((_c = req.body.metrics) === null || _c === void 0 ? void 0 : _c.avg_traffic) || 0,
            trust_score: ((_d = req.body.metrics) === null || _d === void 0 ? void 0 : _d.trust_score) || 0,
            domain_authority: ((_e = req.body.metrics) === null || _e === void 0 ? void 0 : _e.domain_authority) || 0
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
