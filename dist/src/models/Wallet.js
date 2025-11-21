"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WalletSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    go_credits: { type: Number, default: 0 },
    go_coins: { type: Number, default: 0 },
    monthly_limit: { type: Number, default: 5000 }, // Default to Starter plan limit
    total_spent: { type: Number, default: 0 },
    total_earned_coins: { type: Number, default: 0 },
    avg_monthly_spend: { type: Number, default: 0 },
    wallet_address: { type: String },
    phantom_wallet: {
        public_key: { type: String },
        is_connected: { type: Boolean, default: false },
        last_connected: { type: Date },
        token_account: { type: String }, // SPL token account address
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    timestamps: true
});
// Index for Phantom wallet queries
WalletSchema.index({ 'phantom_wallet.public_key': 1 });
// Compound index to ensure one wallet address per user
WalletSchema.index({ user_id: 1, walletAddress: 1 }, { unique: true });
exports.Wallet = mongoose_1.default.model('Wallet', WalletSchema);
