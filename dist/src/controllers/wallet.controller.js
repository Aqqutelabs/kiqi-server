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
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = void 0;
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const Wallet_1 = require("../models/Wallet");
const Transaction_1 = require("../models/Transaction");
const Subscription_1 = require("../models/Subscription");
const authHandler = (fn) => (0, AsyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    return yield fn(req, res, next);
}));
class WalletController {
    constructor() {
        // Get wallet balance
        this.getWalletBalance = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            return res.json(new ApiResponse_1.ApiResponse(200, {
                go_credits: wallet.go_credits,
                go_coins: wallet.go_coins,
                monthly_limit: wallet.monthly_limit,
                total_spent: wallet.total_spent,
                avg_monthly_spend: wallet.avg_monthly_spend
            }, "Wallet balance retrieved successfully"));
        }));
        // Add credits to wallet
        this.addCredits = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                throw new ApiError_1.ApiError(400, "Invalid amount");
            }
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            wallet.go_credits += amount;
            yield wallet.save();
            // Create transaction record
            yield Transaction_1.Transaction.create({
                user_id: req.user._id,
                amount,
                type: 'Credit',
                currency_type: 'go_credits',
                status: 'Completed',
                description: 'Credits added to wallet'
            });
            return res.json(new ApiResponse_1.ApiResponse(200, { wallet }, "Credits added successfully"));
        }));
        // Add a new wallet
        // Deduct credits from wallet
        this.deductCredits = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                throw new ApiError_1.ApiError(400, "Invalid amount");
            }
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            if (wallet.go_credits < amount) {
                throw new ApiError_1.ApiError(400, "Insufficient credits");
            }
            // Check monthly limit
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            const monthlySpent = yield Transaction_1.Transaction.aggregate([
                {
                    $match: {
                        user_id: req.user._id,
                        type: 'Debit',
                        currency_type: 'go_credits',
                        created_at: { $gte: firstDayOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);
            const totalSpentThisMonth = (((_a = monthlySpent[0]) === null || _a === void 0 ? void 0 : _a.total) || 0) + amount;
            if (totalSpentThisMonth > wallet.monthly_limit) {
                throw new ApiError_1.ApiError(400, "Monthly spending limit exceeded");
            }
            wallet.go_credits -= amount;
            wallet.total_spent += amount;
            yield wallet.save();
            // Create transaction record
            yield Transaction_1.Transaction.create({
                user_id: req.user._id,
                amount,
                type: 'Debit',
                currency_type: 'go_credits',
                status: 'Completed',
                description: 'Credits deducted from wallet'
            });
            return res.json(new ApiResponse_1.ApiResponse(200, { wallet }, "Credits deducted successfully"));
        }));
        // Convert credits to coins
        this.convertCreditsToCoins = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                throw new ApiError_1.ApiError(400, "Invalid amount");
            }
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            if (wallet.go_credits < amount) {
                throw new ApiError_1.ApiError(400, "Insufficient credits");
            }
            // Get user's subscription for coin multiplier
            const subscription = yield Subscription_1.Subscription.findOne({
                user_id: req.user._id,
                status: 'Active'
            });
            const multiplier = (subscription === null || subscription === void 0 ? void 0 : subscription.coinMultiplier) || 1;
            const coinsToAdd = amount * multiplier;
            wallet.go_credits -= amount;
            wallet.go_coins += coinsToAdd;
            yield wallet.save();
            // Create transaction records
            yield Transaction_1.Transaction.create([
                {
                    user_id: req.user._id,
                    amount,
                    type: 'Conversion',
                    currency_type: 'go_credits',
                    status: 'Completed',
                    description: 'Credits converted to coins'
                },
                {
                    user_id: req.user._id,
                    amount: coinsToAdd,
                    type: 'Conversion',
                    currency_type: 'go_coins',
                    status: 'Completed',
                    description: 'Coins received from conversion'
                }
            ]);
            return res.json(new ApiResponse_1.ApiResponse(200, {
                wallet,
                converted: {
                    credits: amount,
                    coins: coinsToAdd,
                    multiplier
                }
            }, "Credits converted to coins successfully"));
        }));
        // Get transaction history
        this.getTransactionHistory = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { currency_type, type, startDate, endDate, page = 1, limit = 10 } = req.query;
            const query = {
                user_id: req.user._id
            };
            if (currency_type) {
                query.currency_type = currency_type;
            }
            if (type) {
                query.type = type;
            }
            if (startDate && endDate) {
                query.created_at = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            const skip = (Number(page) - 1) * Number(limit);
            const transactions = yield Transaction_1.Transaction.find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(Number(limit));
            const total = yield Transaction_1.Transaction.countDocuments(query);
            return res.json(new ApiResponse_1.ApiResponse(200, {
                transactions,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }, "Transaction history retrieved successfully"));
        }));
        this.addWallet = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { walletName, walletAddress, status } = req.body;
            // Check if wallet already exists for this user
            const existingWallet = yield Wallet_1.Wallet.findOne({
                user_id: req.user._id,
                walletAddress
            });
            if (existingWallet) {
                throw new ApiError_1.ApiError(400, "Wallet with this address already exists");
            }
            const wallet = yield Wallet_1.Wallet.create({
                user_id: req.user._id,
                walletName,
                walletAddress,
                status: status || 'Active'
            });
            return res
                .status(201)
                .json(new ApiResponse_1.ApiResponse(201, wallet, "Wallet added successfully"));
        }));
        // Get all wallets
        this.getWallets = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const wallets = yield Wallet_1.Wallet.find({ user_id: req.user._id })
                .select('-__v')
                .sort({ createdAt: -1 });
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, wallets, "Wallets retrieved successfully"));
        }));
        // Update wallet
        this.updateWallet = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { walletName, status } = req.body;
            // Verify wallet ownership
            const wallet = yield Wallet_1.Wallet.findOne({ _id: id, user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            const updatedWallet = yield Wallet_1.Wallet.findByIdAndUpdate(id, Object.assign(Object.assign({}, (walletName && { walletName })), (status && { status })), { new: true });
            if (!updatedWallet) {
                throw new ApiError_1.ApiError(404, "Failed to update wallet");
            }
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, updatedWallet, "Wallet updated successfully"));
        }));
        // Delete wallet
        this.deleteWallet = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const wallet = yield Wallet_1.Wallet.findOne({ _id: id, user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            // Check if wallet has any active transactions before deleting
            if (wallet.status === 'Active') {
                wallet.status = 'Inactive';
                yield wallet.save();
            }
            else {
                yield wallet.deleteOne();
            }
            return res
                .status(200)
                .json(new ApiResponse_1.ApiResponse(200, null, "Wallet deleted successfully"));
        }));
    }
}
exports.walletController = new WalletController();
