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
exports.AuthServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = require("../../utils/ApiError");
const auth_util_1 = require("../../utils/auth.util");
const User_1 = require("../../models/User");
const Wallet_1 = require("../../models/Wallet");
const web3_js_1 = require("@solana/web3.js");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
class AuthServiceImpl {
    login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.UserModel.findOne({ email: data.email });
            if (!user) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid email");
            }
            const accessToken = (0, auth_util_1.generateAccessToken)(user.id, user.email);
            const refreshToken = (0, auth_util_1.generateRefreshToken)(user.id, user.email);
            // Exclude sensitive fields
            const userObj = user.toObject();
            delete userObj.password;
            delete userObj.refreshToken;
            return { accessToken, refreshToken, user: userObj };
        });
    }
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { firstName, lastName, email, password, organizationName } = data;
            const existingUser = yield User_1.UserModel.findOne({ email });
            if (existingUser) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Oops, email already taken");
            }
            const user = yield User_1.UserModel.create({
                firstName,
                lastName,
                email,
                password, // Ensure this is hashed in middleware or before this call
                organizationName,
            });
            if (!user) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Unexpected error during user creation");
            }
            return user;
        });
    }
    generateAccessTokenForUser(user) {
        return (0, auth_util_1.generateAccessToken)(user._id.toString(), user.email);
    }
    generateRefreshTokenForUser(user) {
        return (0, auth_util_1.generateRefreshToken)(user._id.toString(), user.email);
    }
    /**
     * Verify Solana wallet signature
     * @param walletAddress - The wallet address
     * @param signature - The signature from the wallet (base58 or base64)
     * @param message - The original message that was signed
     * @returns boolean - True if signature is valid
     */
    verifyWalletSignature(walletAddress, signature, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const publicKey = new web3_js_1.PublicKey(walletAddress);
                // Convert message to bytes
                const messageBytes = new TextEncoder().encode(message);
                // Handle both base64 and base58 encoded signatures
                let signatureBytes;
                try {
                    // Try base64 first
                    signatureBytes = Uint8Array.from(Buffer.from(signature, 'base64'));
                }
                catch (_a) {
                    // Fallback to treating as array of numbers
                    signatureBytes = Uint8Array.from(signature.split(',').map((s) => parseInt(s, 10)));
                }
                // Verify the signature
                const isValid = tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
                return isValid;
            }
            catch (error) {
                console.error('Wallet signature verification error:', error);
                return false;
            }
        });
    }
    /**
     * Create user with wallet (for Web3/Solana signup)
     * @param walletAddress - The Solana wallet address
     * @param signature - The signature proving wallet ownership
     * @param message - The message that was signed
     * @returns User object with access token
     */
    createUserWithWallet(walletAddress, signature, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify the wallet signature first
            const isSignatureValid = yield this.verifyWalletSignature(walletAddress, signature, message);
            if (!isSignatureValid) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid wallet signature");
            }
            // Check if wallet address already exists
            const existingUser = yield User_1.UserModel.findOne({ walletAddress });
            if (existingUser) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Wallet address already registered");
            }
            // Check if valid Solana address
            try {
                new web3_js_1.PublicKey(walletAddress);
            }
            catch (error) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid wallet address");
            }
            // Create user with generic Web3 name
            const user = yield User_1.UserModel.create({
                firstName: 'Web3',
                lastName: 'User',
                email: `${walletAddress}@wallet.local`,
                password: Math.random().toString(36).slice(2, 12), // Random password for social login
                organizationName: 'Web3 Organization',
                walletAddress,
            });
            if (!user) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create user");
            }
            // Create wallet record for the user
            yield Wallet_1.Wallet.create({
                user_id: user._id,
                go_credits: 0,
                go_coins: 0,
                monthly_limit: 5000,
                total_spent: 0,
                total_earned_coins: 0,
                avg_monthly_spend: 0,
                phantom_wallet: {
                    public_key: walletAddress,
                    is_connected: true,
                    last_connected: new Date(),
                },
                status: 'Active',
            });
            const accessToken = this.generateAccessTokenForUser(user);
            const refreshToken = this.generateRefreshTokenForUser(user);
            return { user, accessToken, refreshToken };
        });
    }
}
exports.AuthServiceImpl = AuthServiceImpl;
