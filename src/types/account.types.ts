export interface AccountBalance {
    totalBalance: number;
    totalReceived: number;
    totalSpent: number;
    balanceChangeSinceLastMonth: string;  // e.g., "30% than last month"
}

export interface Wallet {
    _id: string;
    user_id: any;
    walletName: string;  // e.g., "MetaMask", "Trust Wallet"
    walletAddress: string;
    dateAdded: Date;
    status: 'Active' | 'Inactive';
    lastUsed?: Date;
}

export interface Card {
    _id: string;
    user_id: any;
    cardType: 'MasterCard' | 'Visa';
    last4Digits: string;
    cardHolderName: string;
    dateAdded: Date;
    expiryDate: string;
    isDefault: boolean;
    status: 'Active' | 'Expired' | 'Inactive';
}

export interface Transaction {
    _id: string;
    user_id: string;
    transactionId: string;
    description: string;
    amount: number;
    type: 'Credit' | 'Debit';
    status: 'Pending' | 'Completed' | 'Failed';
    channel: 'Wallet' | 'Card' | 'BankTransfer';
    paymentMethod: {
        type: 'Wallet' | 'Card' | 'BankTransfer';
        details: {
            walletId?: string;
            cardId?: string;
            bankName?: string;
        };
    };
    metadata?: {
        campaignId?: string;
        subscriptionId?: string;
    };
    dateCreated: Date;
}

export interface Subscription {
    _id: string;
    user_id: string;
    planName: 'Basic' | 'Pro' | 'Enterprise';
    price: number;
    features: string[];
    status: 'Active' | 'Canceled' | 'Expired';
    startDate: Date;
    endDate: Date;
    nextBillingDate: Date;
    paymentMethodId: string;
}

// Request/Response Types
export interface ConnectWalletRequest {
    walletType: string;
    walletAddress: string;
    signature: string;
}

export interface AddCardRequest {
    cardNumber: string;
    cardHolderName: string;
    cvv: string;
    expiryDate: string;
}

export interface InitiateFundingRequest {
    amount: number;
    paymentMethodType: 'MetaMaskWallet' | 'CreditCard' | 'GooglePay' | 'BankTransfer';
    methodDetails: {
        cardId?: string;
        walletId?: string;
        bankName?: string;
    };
}

export interface TransactionListParams {
    page?: number;
    limit?: number;
    status?: 'Pending' | 'Completed' | 'Failed';
    channel?: 'Wallet' | 'Card' | 'BankTransfer';
}

export interface SubscriptionRequest {
    planName: 'Basic' | 'Pro' | 'Enterprise';
    paymentMethodId: string;
}