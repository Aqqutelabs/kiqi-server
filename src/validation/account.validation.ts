import { z } from 'zod';

// Generic Status Schema
const statusSchema = z.enum(['Active', 'Inactive', 'Pending', 'Canceled', 'Expired']);

// Card Validation Schema
export const     cardSchema = z.object({
    cardNumber: z.string().length(16),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(2),
    cardholderName: z.string().min(3).max(100),
    isDefault: z.boolean().optional(),
});

// Wallet Validation Schema
export const walletSchema = z.object({
    walletType: z.enum(['Bank', 'Crypto', 'Mobile']),
    accountNumber: z.string().min(8),
    bankName: z.string().optional(),
    routingNumber: z.string().optional(),
    isDefault: z.boolean().optional(),
});

// Phantom Wallet Validation Schemas
export const phantomSchema = {
    connect: z.object({
        publicKey: z.string().min(32).max(44)
    }),
    transfer: z.object({
        amount: z.number().positive()
    }),
    verifyTransfer: z.object({
        signature: z.string(),
        transactionId: z.string()
    })
};

// Extended wallet operations
export const walletOperationsSchema = {
    addCredits: z.object({
        amount: z.number().positive(),
        paymentMethodId: z.string(),
    }),
    deductCredits: z.object({
        amount: z.number().positive(),
    }),
    convertCredits: z.object({
        amount: z.number().positive(),
    })
};

// Transaction Validation Schema
export const transactionSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(['Credit', 'Debit']),
    description: z.string().min(3).max(200),
    paymentMethod: z.enum(['Card', 'Wallet', 'Balance']),
    paymentMethodId: z.string(),
});

// Subscription Validation Schema
export const subscriptionSchema = {
    subscribe: z.object({
        body: z.object({
            planName: z.enum(['Basic', 'Pro', 'Enterprise'])
        })
    }),
    update: z.object({
        planName: z.enum(['Basic', 'Pro', 'Enterprise']).optional(),
        billingCycle: z.enum(['monthly', 'annual']).optional(),
        autoRenew: z.boolean().optional()
    }),
    cancel: z.object({
        reason: z.string().min(3).max(500).optional()
    })
};

// Account Balance Update Schema
export const balanceUpdateSchema = z.object({
    amount: z.number().positive(),
    description: z.string().min(3).max(200),
    type: z.enum(['Add', 'Subtract']),
});