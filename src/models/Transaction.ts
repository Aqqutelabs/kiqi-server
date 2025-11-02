import mongoose, { Schema, Document, Model, ObjectId } from 'mongoose';
import { UserAccount } from './UserAccount';

// Define the payment method types as const to ensure type safety
const PaymentMethodTypes = ['Wallet', 'Card', 'BankTransfer'] as const;
const TransactionTypes = ['Credit', 'Debit'] as const;
const TransactionStatuses = ['Pending', 'Completed', 'Failed'] as const;

type PaymentMethodType = typeof PaymentMethodTypes[number];
type TransactionType = typeof TransactionTypes[number];
type TransactionStatus = typeof TransactionStatuses[number];

// Define payment method details type
interface PaymentMethodDetails {
    walletId?: ObjectId;
    cardId?: ObjectId;
    bankName?: string;
}

// Define metadata type
interface TransactionMetadata {
    campaignId?: ObjectId;
    subscriptionId?: ObjectId;
}

// Define base transaction properties
interface TransactionBase {
    user_id: ObjectId;
    transactionId: string;
    description: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    channel: PaymentMethodType;
    paymentMethod: {
        type: PaymentMethodType;
        details: PaymentMethodDetails;
    };
    metadata?: TransactionMetadata;
    dateCreated: Date;
}

// Define the document interface
interface TransactionDocument extends Document, Omit<TransactionBase, 'user_id' | 'metadata'> {
    user_id: ObjectId;
    metadata?: TransactionMetadata;
    createdAt: Date;
    updatedAt: Date;
}

// Define the model interface with static methods
interface TransactionModel extends Model<TransactionDocument> {
    findByTransactionId: (transactionId: string) => Promise<TransactionDocument | null>;
    findUserTransactions: (userId: string | ObjectId) => Promise<TransactionDocument[]>;
    updateUserBalance: (transaction: TransactionDocument) => Promise<void>;
}

const TransactionSchema = new Schema<TransactionDocument>({
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    transactionId: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v: string) {
                return /^[A-Za-z0-9-]+$/.test(v);
            },
            message: 'Transaction ID must only contain alphanumeric characters and hyphens'
        }
    },
    description: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 500 
    },
    amount: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(v: number) {
                return v > 0;
            },
            message: 'Amount must be greater than 0'
        }
    },
    type: { 
        type: String, 
        enum: TransactionTypes,
        required: true,
        validate: {
            validator: (v: string): v is TransactionType => 
                TransactionTypes.includes(v as TransactionType),
            message: 'Invalid transaction type'
        }
    },
    status: { 
        type: String, 
        enum: TransactionStatuses,
        required: true,
        default: 'Pending',
        index: true,
        validate: {
            validator: (v: string): v is TransactionStatus => 
                TransactionStatuses.includes(v as TransactionStatus),
            message: 'Invalid transaction status'
        }
    },
    channel: { 
        type: String, 
        enum: PaymentMethodTypes,
        required: true,
        validate: {
            validator: (v: string): v is PaymentMethodType => 
                PaymentMethodTypes.includes(v as PaymentMethodType),
            message: 'Invalid payment channel'
        }
    },
    paymentMethod: {
        type: { 
            type: String, 
            enum: PaymentMethodTypes,
            required: true,
            validate: {
                validator: (v: string): v is PaymentMethodType => 
                    PaymentMethodTypes.includes(v as PaymentMethodType),
                message: 'Invalid payment method type'
            }
        },
        details: {
            walletId: { 
                type: Schema.Types.ObjectId, 
                ref: 'Wallet',
                validate: {
                    validator: function(this: TransactionDocument, v: mongoose.Types.ObjectId) {
                        return this.paymentMethod.type === 'Wallet' ? !!v : true;
                    },
                    message: 'Wallet ID is required for wallet payments'
                }
            },
            cardId: { 
                type: Schema.Types.ObjectId, 
                ref: 'Card',
                validate: {
                    validator: function(this: TransactionDocument, v: mongoose.Types.ObjectId) {
                        return this.paymentMethod.type === 'Card' ? !!v : true;
                    },
                    message: 'Card ID is required for card payments'
                }
            },
            bankName: {
                type: String,
                validate: {
                    validator: function(this: TransactionDocument, v: string) {
                        return this.paymentMethod.type === 'BankTransfer' ? !!v : true;
                    },
                    message: 'Bank name is required for bank transfers'
                }
            }
        }
    },
    metadata: {
        campaignId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Campaign',
            sparse: true 
        },
        subscriptionId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Subscription',
            sparse: true 
        }
    },
    dateCreated: { 
        type: Date, 
        default: Date.now,
        index: true 
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
TransactionSchema.index({ user_id: 1, dateCreated: -1 });
TransactionSchema.index({ status: 1, dateCreated: -1 });
TransactionSchema.index({ transactionId: 1 }, { unique: true });

// Define static method types
TransactionSchema.static('findByTransactionId', function(
    transactionId: string
): Promise<TransactionDocument | null> {
    return this.findOne({ transactionId })
        .populate('paymentMethod.details.walletId')
        .populate('paymentMethod.details.cardId')
        .exec();
});

TransactionSchema.static('findUserTransactions', function(
    userId: string | ObjectId
): Promise<TransactionDocument[]> {
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    return this.find({ user_id: userObjectId })
        .sort({ dateCreated: -1 })
        .populate('paymentMethod.details.walletId')
        .populate('paymentMethod.details.cardId')
        .exec();
});

TransactionSchema.static('updateUserBalance', async function(
    transaction: TransactionDocument
): Promise<void> {
    if (transaction.status === 'Completed') {
        const amount = transaction.type === 'Credit' ? transaction.amount : -transaction.amount;
        await UserAccount.findOneAndUpdate(
            { user_id: transaction.user_id },
            { 
                $inc: { 
                    balance: amount,
                    totalReceived: transaction.type === 'Credit' ? transaction.amount : 0,
                    totalSpent: transaction.type === 'Debit' ? transaction.amount : 0
                }
            },
            { new: true }
        );
    }
});

// Pre-save middleware to validate payment method details
TransactionSchema.pre<TransactionDocument>('save', function(next) {
    const { type, details } = this.paymentMethod;
    let error: Error | null = null;

    switch (type) {
        case 'Wallet':
            if (!details.walletId) {
                error = new Error('Wallet ID is required for wallet payments');
            }
            break;
        case 'Card':
            if (!details.cardId) {
                error = new Error('Card ID is required for card payments');
            }
            break;
        case 'BankTransfer':
            if (!details.bankName) {
                error = new Error('Bank name is required for bank transfers');
            }
            break;
        default:
            error = new Error('Invalid payment method type');
    }

    // Ensure channel matches payment method type
    if (this.channel !== type) {
        error = new Error('Channel must match payment method type');
    }

    next(error);
});

// Define interface for balance update
interface BalanceUpdate {
    balance: number;
    totalReceived: number;
    totalSpent: number;
}

// Helper function to calculate balance updates
function calculateBalanceUpdate(transaction: TransactionDocument): BalanceUpdate {
    const balanceChange = transaction.type === 'Credit' ? transaction.amount : -transaction.amount;
    return {
        balance: balanceChange,
        totalReceived: transaction.type === 'Credit' ? transaction.amount : 0,
        totalSpent: transaction.type === 'Debit' ? transaction.amount : 0
    };
}

// Auto-update user account balance on transaction completion
TransactionSchema.post<TransactionDocument>('save', async function(this: TransactionDocument) {
    try {
        const model = this.constructor as typeof Transaction;
        await model.updateUserBalance(this);
    } catch (error) {
        // Log error but don't throw to prevent transaction save from failing
        console.error('Error updating user account balance:', error);
        // TODO: Implement retry mechanism or queue system for balance updates
    }
});

// Create and export the model with proper typing
export const Transaction = mongoose.model<TransactionDocument, TransactionModel>(
    'Transaction',
    TransactionSchema
);