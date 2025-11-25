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
exports.conversionService = void 0;
const Conversion_1 = require("../../models/Conversion");
const Wallet_1 = require("../../models/Wallet");
const Transaction_1 = require("../../models/Transaction");
const mongoose_1 = __importDefault(require("mongoose"));
class ConversionService {
    createRequest(userId, amount, solanaWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: userId });
            if (!wallet)
                throw new Error('Wallet not found');
            if (wallet.go_credits < amount)
                throw new Error('Insufficient go credits');
            const conversion = yield Conversion_1.Conversion.create({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                amount,
                solana_wallet: solanaWallet,
                status: 'Pending'
            });
            return conversion;
        });
    }
    listUserRequests(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            const skip = (page - 1) * limit;
            const query = { user_id: new mongoose_1.default.Types.ObjectId(userId) };
            const items = yield Conversion_1.Conversion.find(query).sort({ requested_at: -1 }).skip(skip).limit(limit);
            const total = yield Conversion_1.Conversion.countDocuments(query);
            return { items, total, page, limit };
        });
    }
    listAllRequests() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 50) {
            const skip = (page - 1) * limit;
            const items = yield Conversion_1.Conversion.find().sort({ requested_at: -1 }).skip(skip).limit(limit).populate('user_id');
            const total = yield Conversion_1.Conversion.countDocuments();
            return { items, total, page, limit };
        });
    }
    approveRequest(conversionId, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversion = yield Conversion_1.Conversion.findById(conversionId);
            if (!conversion)
                throw new Error('Conversion not found');
            if (conversion.status !== 'Pending')
                throw new Error('Conversion already processed');
            // Deduct credits and add coins according to user's multiplier
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: conversion.user_id });
            if (!wallet)
                throw new Error('User wallet not found');
            if (wallet.go_credits < conversion.amount)
                throw new Error('Insufficient credits');
            // Determine multiplier (if subscription model exists elsewhere, keep simple 1:1 for now)
            let multiplier = 1;
            // Try to read subscription multiplier if available
            try {
                const Subscription = require('../../models/Subscription').Subscription;
                const sub = yield Subscription.findOne({ user_id: conversion.user_id, status: 'Active' });
                if (sub && sub.coinMultiplier)
                    multiplier = sub.coinMultiplier;
            }
            catch (e) {
                // ignore if subscription model not present
            }
            const coinsToAdd = conversion.amount * multiplier;
            wallet.go_credits -= conversion.amount;
            wallet.go_coins += coinsToAdd;
            yield wallet.save();
            // Create transaction records
            yield Transaction_1.Transaction.create([
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
            conversion.admin_id = new mongoose_1.default.Types.ObjectId(adminId);
            yield conversion.save();
            return conversion;
        });
    }
    rejectRequest(conversionId, adminId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const conversion = yield Conversion_1.Conversion.findById(conversionId);
            if (!conversion)
                throw new Error('Conversion not found');
            if (conversion.status !== 'Pending')
                throw new Error('Conversion already processed');
            conversion.status = 'Rejected';
            conversion.resolved_at = new Date();
            conversion.admin_id = new mongoose_1.default.Types.ObjectId(adminId);
            conversion.reason = reason;
            yield conversion.save();
            return conversion;
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Conversion_1.Conversion.findById(id).populate('user_id').exec();
        });
    }
}
exports.conversionService = new ConversionService();
