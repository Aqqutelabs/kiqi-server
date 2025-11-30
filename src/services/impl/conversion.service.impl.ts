import { Conversion } from '../../models/Conversion';
import { Wallet } from '../../models/Wallet';
import { Transaction } from '../../models/Transaction';
import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

class ConversionService {
    async createRequest(userId: string, amount: number, solanaWallet: string) {
        // Fetch only the go_credits field from the user's wallet — do NOT fetch any Solana wallet info
        // Ensure userId is an ObjectId for the query (handles string or ObjectId inputs)
        const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

        // Try to find the user's wallet. If none exists, create a default wallet so users
        // always have a wallet (prevents forcing users to call an `addWallet` endpoint).
        let wallet = await Wallet.findOne({ user_id: userObjectId }).select('go_credits');
        if (!wallet) {
            // Auto-create a wallet with zero balances and default limits
            wallet = await Wallet.create({
                user_id: userObjectId,
                go_credits: 10000,
                go_coins: 0,
                monthly_limit: 5000,
                total_spent: 0,
                total_earned_coins: 0,
                avg_monthly_spend: 0,
                status: 'Active'
            });
        }

        if ((wallet.go_credits || 0) < amount) throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient go credits');

        const conversion = await Conversion.create({
            user_id: new mongoose.Types.ObjectId(userId),
            amount,
            solana_wallet: solanaWallet,
            status: 'Pending'
        });

        return conversion;
    }

    async listUserRequests(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = { user_id: new mongoose.Types.ObjectId(userId) };
        const items = await Conversion.find(query).sort({ requested_at: -1 }).skip(skip).limit(limit);
        const total = await Conversion.countDocuments(query);
        return { items, total, page, limit };
    }

    async listAllRequests(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const items = await Conversion.find().sort({ requested_at: -1 }).skip(skip).limit(limit).populate('user_id');
        const total = await Conversion.countDocuments();
        return { items, total, page, limit };
    }

    async approveRequest(conversionId: string, adminId: string) {
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) throw new Error('Conversion not found');
        if (conversion.status !== 'Pending') throw new Error('Conversion already processed');

        // Deduct credits and add coins according to user's multiplier
        const wallet = await Wallet.findOne({ user_id: conversion.user_id });
        if (!wallet) throw new ApiError(StatusCodes.NOT_FOUND, 'User wallet not found');

        if (wallet.go_credits < conversion.amount) throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient credits');

        // Determine multiplier (if subscription model exists elsewhere, keep simple 1:1 for now)
        let multiplier = 1;
        // Try to read subscription multiplier if available
        try {
            const Subscription = require('../../models/Subscription').Subscription;
            const sub = await Subscription.findOne({ user_id: conversion.user_id, status: 'Active' });
            if (sub && sub.coinMultiplier) multiplier = sub.coinMultiplier;
        } catch (e) {
            // ignore if subscription model not present
        }

        const coinsToAdd = conversion.amount * multiplier;

        wallet.go_credits -= conversion.amount;
        wallet.go_coins += coinsToAdd;
        await wallet.save();

        // Create transaction records
        await Transaction.create([
            {
                user_id: conversion.user_id,
                amount: conversion.amount,
                type: 'Conversion',
                currencyType: 'go_credits',
                status: 'Completed',
                description: 'Conversion request approved - credits deducted',
                paymentMethod: { type: 'Wallet', details: { walletId: wallet._id } },
                channel: 'Wallet'
            },
            {
                user_id: conversion.user_id,
                amount: coinsToAdd,
                type: 'Conversion',
                currencyType: 'go_coins',
                status: 'Completed',
                description: 'Conversion request approved - coins added',
                paymentMethod: { type: 'Wallet', details: { walletId: wallet._id } },
                channel: 'Wallet'
            }
        ]);

        conversion.status = 'Approved';
        conversion.resolved_at = new Date();
        conversion.admin_id = new mongoose.Types.ObjectId(adminId);
        await conversion.save();

        return conversion;
    }

    async rejectRequest(conversionId: string, adminId: string, reason?: string) {
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) throw new Error('Conversion not found');
        if (conversion.status !== 'Pending') throw new Error('Conversion already processed');

        conversion.status = 'Rejected';
        conversion.resolved_at = new Date();
        conversion.admin_id = new mongoose.Types.ObjectId(adminId);
        conversion.reason = reason;
        await conversion.save();

        return conversion;
    }

    async getById(id: string) {
        return Conversion.findById(id).populate('user_id').exec();
    }
}

export const conversionService = new ConversionService();
