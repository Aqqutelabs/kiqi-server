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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSolanaAddress = exports.SolanaService = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const config_1 = __importDefault(require("../config/config"));
// Environment checks
if (!((_a = config_1.default.solana) === null || _a === void 0 ? void 0 : _a.rpcEndpoint)) {
    throw new Error('Solana RPC endpoint not configured');
}
if (!((_b = config_1.default.solana) === null || _b === void 0 ? void 0 : _b.goCoinMint)) {
    throw new Error('GoCoin mint address not configured');
}
// Solana connection
const connection = new web3_js_1.Connection(config_1.default.solana.rpcEndpoint, 'confirmed');
// GoCoin token details
const GOCOIN_MINT = new web3_js_1.PublicKey(config_1.default.solana.goCoinMint);
const GOCOIN_DECIMALS = 9; // Standard SPL token decimals
class SolanaService {
    /**
     * Get or create an associated token account for the GoCoin token
     */
    static getOrCreateAssociatedTokenAccount(walletPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKey = new web3_js_1.PublicKey(walletPublicKey);
            try {
                const associatedTokenAddress = yield (0, spl_token_1.getAssociatedTokenAddress)(GOCOIN_MINT, publicKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
                // Check if the account exists
                const tokenAccount = yield connection.getTokenAccountBalance(associatedTokenAddress);
                return {
                    address: associatedTokenAddress.toString(),
                    exists: true
                };
            }
            catch (error) {
                // If account doesn't exist, return the address that would be created
                const associatedTokenAddress = yield (0, spl_token_1.getAssociatedTokenAddress)(GOCOIN_MINT, publicKey, false, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
                return {
                    address: associatedTokenAddress.toString(),
                    exists: false
                };
            }
        });
    }
    /**
     * Get GoCoin balance for a wallet
     */
    static getGoCoinBalance(tokenAccountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const tokenAccount = yield connection.getTokenAccountBalance(new web3_js_1.PublicKey(tokenAccountAddress));
                return parseFloat(((_a = tokenAccount.value.uiAmount) === null || _a === void 0 ? void 0 : _a.toString()) || '0');
            }
            catch (error) {
                console.error('Error getting token balance:', error);
                return 0;
            }
        });
    }
    /**
     * Create instructions for transferring GoCoins
     * Note: This creates the transaction instructions but doesn't sign or send them
     * The actual signing needs to be done by the Phantom wallet on the client side
     */
    static createTransferInstructions(fromPublicKey, toPublicKey, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const fromPubkey = new web3_js_1.PublicKey(fromPublicKey);
            const toPubkey = new web3_js_1.PublicKey(toPublicKey);
            // Get or create associated token accounts
            const fromTokenAccount = yield this.getOrCreateAssociatedTokenAccount(fromPublicKey);
            const toTokenAccount = yield this.getOrCreateAssociatedTokenAccount(toPublicKey);
            // Create the token transfer instruction
            const transferInstruction = (0, spl_token_1.createTransferInstruction)(new web3_js_1.PublicKey(fromTokenAccount.address), new web3_js_1.PublicKey(toTokenAccount.address), fromPubkey, amount * Math.pow(10, GOCOIN_DECIMALS), [], spl_token_1.TOKEN_PROGRAM_ID);
            // Create transaction
            const transaction = new web3_js_1.Transaction().add(transferInstruction);
            // Get the latest blockhash
            const { blockhash } = yield connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromPubkey;
            return {
                transaction: transaction.serialize({ requireAllSignatures: false }),
                toTokenAccount: toTokenAccount.address,
                fromTokenAccount: fromTokenAccount.address
            };
        });
    }
    /**
     * Verify a GoCoin transfer transaction
     */
    static verifyTransaction(signature) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const confirmation = yield connection.confirmTransaction(signature);
                return confirmation.value.err === null;
            }
            catch (error) {
                console.error('Error verifying transaction:', error);
                return false;
            }
        });
    }
    /**
     * Get transaction history for a token account
     */
    static getTokenTransactionHistory(tokenAccountAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const signatures = yield connection.getSignaturesForAddress(new web3_js_1.PublicKey(tokenAccountAddress), { limit: 10 });
                const transactions = yield Promise.all(signatures.map((sig) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d;
                    const tx = yield connection.getTransaction(sig.signature);
                    return {
                        signature: sig.signature,
                        timestamp: sig.blockTime,
                        status: ((_a = tx === null || tx === void 0 ? void 0 : tx.meta) === null || _a === void 0 ? void 0 : _a.err) ? 'failed' : 'success',
                        amount: ((_d = (_c = (_b = tx === null || tx === void 0 ? void 0 : tx.meta) === null || _b === void 0 ? void 0 : _b.postTokenBalances) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.uiTokenAmount.uiAmount) || 0
                    };
                })));
                return transactions;
            }
            catch (error) {
                console.error('Error getting transaction history:', error);
                return [];
            }
        });
    }
}
exports.SolanaService = SolanaService;
// Helper function to validate Solana addresses
const isValidSolanaAddress = (address) => {
    try {
        new web3_js_1.PublicKey(address);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.isValidSolanaAddress = isValidSolanaAddress;
