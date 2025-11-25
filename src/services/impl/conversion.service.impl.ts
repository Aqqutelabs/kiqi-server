import { Conversion } from '../../models/Conversion';
import { Wallet } from '../../models/Wallet';
import { Transaction } from '../../models/Transaction';
import mongoose from 'mongoose';

class ConversionService {
    async createRequest(userId: string, amount: number, solanaWallet: string) {
        const wallet = await Wallet.findOne({ user_id: userId });
        if (!wallet) throw new Error('Wallet not found');

        if (wallet.go_credits < amount) throw new Error('Insufficient go credits');

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
        if (!wallet) throw new Error('User wallet not found');

        if (wallet.go_credits < conversion.amount) throw new Error('Insufficient credits');

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
