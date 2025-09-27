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
exports.loginWithWallet = exports.getWeb3LoginMessage = exports.resetPassword = exports.forgotPassword = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ethers_1 = require("ethers");
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../services/User");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const EmailService_1 = require("../utils/EmailService");
const generateAccessAndRefreshTokens = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.authService.findUserById(userId);
    if (!user)
        throw new ApiError_1.ApiError(500, 'User not found while generating tokens');
    // Ensure we have the required secrets
    const accessTokenSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!accessTokenSecret || !refreshTokenSecret) {
        throw new ApiError_1.ApiError(500, 'JWT secrets not configured');
    }
    // Get expiry values with proper defaults and explicit typing
    const accessTokenExpiry = (process.env.JWT_ACCESS_EXPIRES || "1week");
    const refreshTokenExpiry = (process.env.JWT_REFRESH_EXPIRES || "7d");
    const accessTokenOptions = { expiresIn: accessTokenExpiry };
    const refreshTokenOptions = { expiresIn: refreshTokenExpiry };
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, accessTokenSecret, accessTokenOptions);
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, refreshTokenSecret, refreshTokenOptions);
    yield User_1.authService.updateUser(user.id, { refreshToken });
    return { accessToken, refreshToken };
});
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
};
// Traditional Auth
exports.registerUser = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, password, organizationName } = req.body;
    const existingUser = yield User_1.authService.findUserByEmail(email);
    if (existingUser) {
        throw new ApiError_1.ApiError(409, "User with this email already exists");
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const user = yield User_1.authService.createUser({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        organizationName,
    });
    // Remove password and refresh token from the response
    const createdUser = Object.assign({}, user);
    delete createdUser.password;
    delete createdUser.refreshToken;
    res.status(201).json(new ApiResponse_1.ApiResponse(201, createdUser, "User registered successfully"));
}));
exports.loginUser = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield User_1.authService.findUserByEmail(email);
    if (!user || !user.password) {
        throw new ApiError_1.ApiError(404, "User does not exist or has signed up with a social account");
    }
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError_1.ApiError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } = yield generateAccessAndRefreshTokens(user.id);
    const loggedInUser = Object.assign({}, user);
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;
    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
}));
exports.logoutUser = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (typeof userId === 'string') {
        yield User_1.authService.updateUser(userId, { refreshToken: undefined });
    }
    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, {}, "User logged out"));
}));
// Password Reset Flow
exports.forgotPassword = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield User_1.authService.findUserByEmail(email);
    if (!user) {
        // We don't want to reveal if a user exists
        res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "If a user with that email exists, a password reset OTP has been sent."));
        return;
    }
    const otp = crypto_1.default.randomInt(100000, 999999).toString();
    User_1.authService.createPasswordResetOTP(email, otp);
    const emailText = `Your password reset OTP for KiQi is: ${otp}. It is valid for 10 minutes.`;
    yield (0, EmailService_1.sendEmail)({
        to: user.email,
        subject: 'KiQi - Reset Your Password',
        text: emailText,
        html: `<p>${emailText}</p>`,
    });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "If a user with that email exists, a password reset OTP has been sent."));
}));
exports.resetPassword = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, newPassword } = req.body;
    const isValidOTP = User_1.authService.verifyPasswordResetOTP(email, otp);
    if (!isValidOTP) {
        throw new ApiError_1.ApiError(400, "Invalid or expired OTP");
    }
    const user = yield User_1.authService.findUserByEmail(email);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
    yield User_1.authService.updateUser(user.id, { password: hashedPassword });
    User_1.authService.clearPasswordResetOTP(email);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Password has been reset successfully. Please log in."));
}));
// Web3 Wallet Auth
// In a real app, the "nonce" should be stored and validated to prevent replay attacks.
const loginMessage = "Welcome to KiQi! Sign this message to log in. Nonce: ";
exports.getWeb3LoginMessage = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address } = req.query;
    if (!address)
        throw new ApiError_1.ApiError(400, "Wallet address is required");
    // Generate a secure, unique nonce for the user
    const nonce = crypto_1.default.randomBytes(16).toString('hex');
    // Store this nonce associated with the user's address with an expiry
    // For now, we'll just return it.
    yield User_1.authService.updateUser(address, { loginNonce: nonce }); // This assumes we can find/create user by address temporarily
    const message = `${loginMessage}${nonce}`;
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { message }, "Message to sign for login"));
}));
exports.loginWithWallet = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address, signature } = req.body;
    // In a real app, retrieve the stored nonce for this address
    const tempNonce = "some-retrieved-nonce"; // Placeholder
    const message = `${loginMessage}${tempNonce}`;
    const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new ApiError_1.ApiError(401, "Signature verification failed.");
    }
    let user = yield User_1.authService.findUserByWalletAddress(address);
    if (!user) {
        // If user doesn't exist, create a new one.
        // You might redirect them to a page to complete their profile (name, org, etc.).
        user = yield User_1.authService.createUser({ walletAddress: address, firstName: 'Web3', lastName: 'User', organizationName: 'My Web3 Org' });
    }
    const { accessToken, refreshToken } = yield generateAccessAndRefreshTokens(user.id);
    const loggedInUser = Object.assign({}, user);
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;
    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, { user: loggedInUser, accessToken }, "Wallet login successful"));
}));
