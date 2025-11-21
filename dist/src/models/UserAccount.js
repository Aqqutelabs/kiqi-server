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
exports.UserAccount = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserAccountSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    totalReceived: { type: Number, required: true, default: 0 },
    totalSpent: { type: Number, required: true, default: 0 },
    lastBalanceUpdate: { type: Date, default: Date.now },
    lastMonthBalance: { type: Number, required: true, default: 0 }
}, {
    timestamps: true
});
// Methods to calculate balance change
UserAccountSchema.methods.getBalanceChange = function () {
    if (this.lastMonthBalance === 0)
        return '0% than last month';
    const change = ((this.balance - this.lastMonthBalance) / this.lastMonthBalance) * 100;
    return `${Math.abs(change).toFixed(1)}% ${change >= 0 ? 'more' : 'less'} than last month`;
};
// Update lastMonthBalance at the start of each month
UserAccountSchema.pre('save', function (next) {
    const now = new Date();
    const lastUpdate = this.lastBalanceUpdate;
    if (now.getMonth() !== lastUpdate.getMonth() || now.getFullYear() !== lastUpdate.getFullYear()) {
        this.lastMonthBalance = this.balance;
    }
    this.lastBalanceUpdate = now;
    next();
});
exports.UserAccount = mongoose_1.default.model('UserAccount', UserAccountSchema);
