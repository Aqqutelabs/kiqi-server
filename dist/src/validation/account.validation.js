"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceUpdateSchema = exports.subscriptionSchema = exports.transactionSchema = exports.walletOperationsSchema = exports.phantomSchema = exports.walletSchema = exports.cardSchema = void 0;
const zod_1 = require("zod");
// Generic Status Schema
const statusSchema = zod_1.z.enum(['Active', 'Inactive', 'Pending', 'Canceled', 'Expired']);
// Card Validation Schema
exports.cardSchema = zod_1.z.object({
    cardNumber: zod_1.z.string().length(16),
    expiryMonth: zod_1.z.string().length(2),
    expiryYear: zod_1.z.string().length(2),
    cardholderName: zod_1.z.string().min(3).max(100),
    isDefault: zod_1.z.boolean().optional(),
});
// Wallet Validation Schema
exports.walletSchema = zod_1.z.object({
    walletType: zod_1.z.enum(['Bank', 'Crypto', 'Mobile']),
    accountNumber: zod_1.z.string().min(8),
    bankName: zod_1.z.string().optional(),
    routingNumber: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().optional(),
});
// Phantom Wallet Validation Schemas
exports.phantomSchema = {
    connect: zod_1.z.object({
        publicKey: zod_1.z.string().min(32).max(44)
    }),
    transfer: zod_1.z.object({
        amount: zod_1.z.number().positive()
    }),
    verifyTransfer: zod_1.z.object({
        signature: zod_1.z.string(),
        transactionId: zod_1.z.string()
    })
};
// Extended wallet operations
exports.walletOperationsSchema = {
    addCredits: zod_1.z.object({
        amount: zod_1.z.number().positive(),
        paymentMethodId: zod_1.z.string(),
    }),
    deductCredits: zod_1.z.object({
        amount: zod_1.z.number().positive(),
    }),
    convertCredits: zod_1.z.object({
        amount: zod_1.z.number().positive(),
    })
};
// Transaction Validation Schema
exports.transactionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum(['Credit', 'Debit']),
    description: zod_1.z.string().min(3).max(200),
    paymentMethod: zod_1.z.enum(['Card', 'Wallet', 'Balance']),
    paymentMethodId: zod_1.z.string(),
});
// Subscription Validation Schema
exports.subscriptionSchema = {
    subscribe: zod_1.z.object({
        body: zod_1.z.object({
            planName: zod_1.z.enum(['Basic', 'Pro', 'Enterprise'])
        })
    }),
    update: zod_1.z.object({
        planName: zod_1.z.enum(['Basic', 'Pro', 'Enterprise']).optional(),
        billingCycle: zod_1.z.enum(['monthly', 'annual']).optional(),
        autoRenew: zod_1.z.boolean().optional()
    }),
    cancel: zod_1.z.object({
        reason: zod_1.z.string().min(3).max(500).optional()
    })
};
// Account Balance Update Schema
exports.balanceUpdateSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(3).max(200),
    type: zod_1.z.enum(['Add', 'Subtract']),
});
