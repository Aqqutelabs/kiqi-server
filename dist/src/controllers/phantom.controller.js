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
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const Wallet_1 = require("../models/Wallet");
const Transaction_1 = require("../models/Transaction");
const solana_service_1 = require("../utils/solana.service");
const config_1 = __importDefault(require("../config/config"));
// Wrapper to handle authentication type safety
const authHandler = (handler) => (0, AsyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || !req.user._id) {
        throw new ApiError_1.ApiError(401, 'User not authenticated');
    }
    return yield handler(req, res, next);
}));
class PhantomWalletController {
    constructor() {
        // Connect Phantom wallet
        this.connectPhantomWallet = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { publicKey } = req.body;
            if (!(0, solana_service_1.isValidSolanaAddress)(publicKey)) {
                throw new ApiError_1.ApiError(400, "Invalid Solana address provided");
            }
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            // Get or create associated token account
            const tokenAccount = yield solana_service_1.SolanaService.getOrCreateAssociatedTokenAccount(publicKey);
            wallet.phantom_wallet = {
                public_key: publicKey,
                is_connected: true,
                last_connected: new Date(),
                token_account: tokenAccount.address
            };
            yield wallet.save();
            return res.json(new ApiResponse_1.ApiResponse(200, { wallet }, "Phantom wallet connected successfully"));
        }));
        // Disconnect Phantom wallet
        this.disconnectPhantomWallet = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            if (!((_a = wallet.phantom_wallet) === null || _a === void 0 ? void 0 : _a.is_connected)) {
                throw new ApiError_1.ApiError(400, "No Phantom wallet is currently connected");
            }
            wallet.phantom_wallet.is_connected = false;
            yield wallet.save();
            return res.json(new ApiResponse_1.ApiResponse(200, null, "Phantom wallet disconnected successfully"));
        }));
        // Get Phantom wallet balance
        this.getPhantomBalance = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            if (!((_a = wallet.phantom_wallet) === null || _a === void 0 ? void 0 : _a.is_connected)) {
                throw new ApiError_1.ApiError(400, "No Phantom wallet is currently connected");
            }
            const balance = yield solana_service_1.SolanaService.getGoCoinBalance(wallet.phantom_wallet.token_account);
            return res.json(new ApiResponse_1.ApiResponse(200, { balance }, "Balance retrieved successfully"));
        }));
        // Transfer GoCoins to Phantom wallet
        this.transferToPhantom = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                throw new ApiError_1.ApiError(400, "Invalid amount");
            }
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            if (!((_a = wallet.phantom_wallet) === null || _a === void 0 ? void 0 : _a.is_connected)) {
                throw new ApiError_1.ApiError(400, "No Phantom wallet is currently connected");
            }
            if (wallet.go_coins < amount) {
                throw new ApiError_1.ApiError(400, "Insufficient GoCoins balance");
            }
            // Create transfer instructions
            const transferInstructions = yield solana_service_1.SolanaService.createTransferInstructions(config_1.default.solana.goWallet.publicKey, wallet.phantom_wallet.public_key, amount);
            // Deduct from internal wallet first
            wallet.go_coins -= amount;
            yield wallet.save();
            // Create transaction record
            yield Transaction_1.Transaction.create({
                user_id: req.user._id,
                amount,
                type: 'Transfer',
                currency_type: 'go_coins',
                status: 'Pending',
                description: 'Transfer to Phantom wallet',
                metadata: {
                    phantom_wallet: wallet.phantom_wallet.public_key,
                    token_account: wallet.phantom_wallet.token_account,
                    transfer_instructions: transferInstructions
                }
            });
            return res.json(new ApiResponse_1.ApiResponse(200, {
                transferInstructions,
                wallet
            }, "Transfer instructions created successfully"));
        }));
        // Verify Phantom transfer
        this.verifyPhantomTransfer = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { signature, transactionId } = req.body;
            const transaction = yield Transaction_1.Transaction.findById(transactionId);
            if (!transaction) {
                throw new ApiError_1.ApiError(404, "Transaction not found");
            }
            const isValid = yield solana_service_1.SolanaService.verifyTransaction(signature);
            if (isValid) {
                transaction.status = 'Completed';
                yield transaction.save();
                return res.json(new ApiResponse_1.ApiResponse(200, { transaction }, "Transfer verified successfully"));
            }
            else {
                // Revert the transfer if verification fails
                const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
                if (wallet) {
                    wallet.go_coins += transaction.amount;
                    yield wallet.save();
                }
                transaction.status = 'Failed';
                yield transaction.save();
                throw new ApiError_1.ApiError(400, "Transfer verification failed");
            }
        }));
        // Get Phantom transaction history
        this.getPhantomTransactions = authHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: req.user._id });
            if (!wallet) {
                throw new ApiError_1.ApiError(404, "Wallet not found");
            }
            if (!((_a = wallet.phantom_wallet) === null || _a === void 0 ? void 0 : _a.is_connected)) {
                throw new ApiError_1.ApiError(400, "No Phantom wallet is currently connected");
            }
            const transactions = yield solana_service_1.SolanaService.getTokenTransactionHistory(wallet.phantom_wallet.token_account);
            return res.json(new ApiResponse_1.ApiResponse(200, { transactions }, "Transaction history retrieved successfully"));
        }));
    }
}
exports.default = new PhantomWalletController();
