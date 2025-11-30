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
exports.Transaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserAccount_1 = require("./UserAccount");
// Define the payment method types as const to ensure type safety
const PaymentMethodTypes = ['Wallet', 'Card', 'BankTransfer', 'Paystack'];
const TransactionTypes = ['Credit', 'Debit', 'Referral', 'Conversion', 'Purchase', 'Refund'];
const TransactionStatuses = ['Pending', 'Completed', 'Failed'];
const TransactionSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    transactionId: {
        type: String,
        required: false,
        unique: true,
<<<<<<< HEAD
        default: () => new mongoose_1.default.Types.ObjectId().toHexString(),
=======
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd
        validate: {
            validator: function (v) {
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
            validator: function (v) {
                return v > 0;
            },
            message: 'Amount must be greater than 0'
        }
    },
    currencyType: {
        type: String,
        enum: ['go_credits', 'go_coins'],
        required: false
    },
    referenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        index: true
    },
    type: {
        type: String,
        enum: TransactionTypes,
        required: true,
        validate: {
            validator: (v) => TransactionTypes.includes(v),
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
            validator: (v) => TransactionStatuses.includes(v),
            message: 'Invalid transaction status'
        }
    },
    channel: {
        type: String,
        enum: PaymentMethodTypes,
        required: false,
        validate: {
            validator: (v) => PaymentMethodTypes.includes(v),
            message: 'Invalid payment channel'
        }
    },
    paymentMethod: {
        type: {
            type: String,
            enum: ['Wallet', 'Card', 'BankTransfer', 'Paystack'],
            required: true,
            validate: {
                validator: (v) => ['Wallet', 'Card', 'BankTransfer', 'Paystack'].includes(v),
                message: 'Invalid payment method type'
            }
        },
        details: {
            walletId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Wallet',
                validate: {
                    validator: function (v) {
                        var _a;
                        return ((_a = this.paymentMethod) === null || _a === void 0 ? void 0 : _a.type) === 'Wallet' ? !!v : true;
                    },
                    message: 'Wallet ID is required for wallet payments'
                }
            },
            cardId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Card'
            },
            bankName: String
        }
    },
    metadata: {
        campaignId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Campaign',
            sparse: true
        },
        subscriptionId: {
            type: mongoose_1.Schema.Types.ObjectId,
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
<<<<<<< HEAD
// Keep a unique index on transactionId. We auto-generate a value by default so it
// will not be null; if you prefer to allow missing transactionId for some records
// use `sparse: true` or `partialFilterExpression` instead.
=======
>>>>>>> 84efefb7f747ca707d27caf124b83dbfefb4f8bd
TransactionSchema.index({ transactionId: 1 }, { unique: true });
// Define static method types
TransactionSchema.static('findByTransactionId', function (transactionId) {
    return this.findOne({ transactionId })
        .populate('paymentMethod.details.walletId')
        .populate('paymentMethod.details.cardId')
        .exec();
});
TransactionSchema.static('findUserTransactions', function (userId) {
    const userObjectId = typeof userId === 'string' ? new mongoose_1.default.Types.ObjectId(userId) : userId;
    return this.find({ user_id: userObjectId })
        .sort({ dateCreated: -1 })
        .populate('paymentMethod.details.walletId')
        .populate('paymentMethod.details.cardId')
        .exec();
});
TransactionSchema.static('updateUserBalance', function (transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        if (transaction.status === 'Completed') {
            const amount = transaction.type === 'Credit' ? transaction.amount : -transaction.amount;
            yield UserAccount_1.UserAccount.findOneAndUpdate({ user_id: transaction.user_id }, {
                $inc: {
                    balance: amount,
                    totalReceived: transaction.type === 'Credit' ? transaction.amount : 0,
                    totalSpent: transaction.type === 'Debit' ? transaction.amount : 0
                }
            }, { new: true });
        }
    });
});
// Pre-save middleware to validate payment method details
TransactionSchema.pre('save', function (next) {
    const { type, details } = this.paymentMethod;
    let error = null;
    switch (type) {
        case 'Wallet':
            if (!details.walletId)
                error = new Error('Wallet ID is required for wallet payments');
            break;
        case 'Card':
            // Only require cardId if it's an internal saved card
            if (!details.cardId && this.channel === 'Card') {
                console.warn('Card ID missing, skipping for external payment method');
                // Optional: don't throw, just skip
            }
            break;
        case 'BankTransfer':
            if (!details.bankName)
                error = new Error('Bank name is required for bank transfers');
            break;
        case 'Paystack':
            // External gateway, no details required
            break;
        default:
            error = new Error('Invalid payment method type');
    }
    // Ensure channel matches payment method type
    if (this.channel !== type && type !== 'Paystack') {
        error = new Error('Channel must match payment method type');
    }
    next(error);
});
// Helper function to calculate balance updates
function calculateBalanceUpdate(transaction) {
    const balanceChange = transaction.type === 'Credit' ? transaction.amount : -transaction.amount;
    return {
        balance: balanceChange,
        totalReceived: transaction.type === 'Credit' ? transaction.amount : 0,
        totalSpent: transaction.type === 'Debit' ? transaction.amount : 0
    };
}
// Auto-update user account balance on transaction completion
TransactionSchema.post('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const model = this.constructor;
            yield model.updateUserBalance(this);
        }
        catch (error) {
            // Log error but don't throw to prevent transaction save from failing
            console.error('Error updating user account balance:', error);
            // TODO: Implement retry mechanism or queue system for balance updates
        }
    });
});
// Create and export the model with proper typing
exports.Transaction = mongoose_1.default.model('Transaction', TransactionSchema);
