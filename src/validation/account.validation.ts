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

// Transaction Validation Schema
export const transactionSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(['Credit', 'Debit']),
    description: z.string().min(3).max(200),
    paymentMethod: z.enum(['Card', 'Wallet', 'Balance']),
    paymentMethodId: z.string(),
});

// Subscription Validation Schema
export const subscriptionSchema = z.object({
    planName: z.enum(['Basic', 'Pro', 'Enterprise']),
    price: z.number().positive(),
    features: z.array(z.string()),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    nextBillingDate: z.string().datetime(),
    paymentMethodId: z.string(),
});

// Update Subscription Schema
export const updateSubscriptionSchema = subscriptionSchema.partial().omit({
    startDate: true,
});

// Account Balance Update Schema
export const balanceUpdateSchema = z.object({
    amount: z.number().positive(),
    description: z.string().min(3).max(200),
    type: z.enum(['Add', 'Subtract']),
});