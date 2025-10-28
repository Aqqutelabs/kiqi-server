import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { PressRelease } from '../models/PressRelease';
import { Publisher } from '../models/Publisher';
import { Order } from '../models/Order';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/Auth.middlewares';
import { CheckoutPublicationItem } from '../types/pressRelease.types';

export const getPressReleasesList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    
    const pressReleases = await PressRelease.find({ user_id: userId })
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

    return res.json(new ApiResponse(200, pressRelease));
});

export const createPressRelease = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    const { campaign_id, campaign, title, pr_content, status } = req.body;
    
    const pressRelease = await PressRelease.create({
        campaign_id: new mongoose.Types.ObjectId(campaign_id),
        campaign,  // Add the campaign name
        title,
        content: pr_content,
        status,
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
    const publisher = await Publisher.findOne({ id: req.params.id });
    
    if (!publisher) {
        throw new ApiError(404, 'Publisher not found');
    }

    return res.json(new ApiResponse(200, publisher));
});

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, 'Unauthorized');

    const { publications, payment_method } = req.body;

    // Calculate order summary
    const subtotal = publications.reduce((acc: number, pub: CheckoutPublicationItem) => {
        const price = parseFloat(pub.price.replace(/[^0-9.-]+/g, ''));
        return acc + price;
    }, 0);

    const vat_percentage = '7.5%';
    const vat_amount = subtotal * 0.075;
    const total_amount = subtotal + vat_amount;

    const order = await Order.create({
        user_id: userId,  // userId is already checked above
        publications,
        order_summary: {
            subtotal: `₦${subtotal.toLocaleString()}`,
            vat_percentage,
            vat_amount: `₦${vat_amount.toLocaleString()}`,
            total_amount: `₦${total_amount.toLocaleString()}`
        },
        payment_method,
        status: 'Pending'
    });

    return res.json(new ApiResponse(201, order));
});

export const getOrderDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return res.json(new ApiResponse(200, order));
});