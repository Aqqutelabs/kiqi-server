import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { authService } from '../services/User';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { sendEmail } from '../utils/EmailService';
import { AuthRequest } from './Auth.middlewares';


const generateAccessAndRefreshTokens = async (userId: string) => {
    const user = await authService.findUserById(userId);
    if (!user) throw new ApiError(500, 'User not found while generating tokens');

    // Ensure we have the required secrets
    const accessTokenSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.JWT_SECRET;
    
    if (!accessTokenSecret || !refreshTokenSecret) {
        throw new ApiError(500, 'JWT secrets not configured');
    }

    // Get expiry values with proper defaults and explicit typing
    const accessTokenExpiry = (process.env.JWT_ACCESS_EXPIRES || "1week") as jwt.SignOptions['expiresIn'];
    const refreshTokenExpiry = (process.env.JWT_REFRESH_EXPIRES || "7d") as jwt.SignOptions['expiresIn'];

    const accessTokenOptions: jwt.SignOptions = { expiresIn: accessTokenExpiry };
    const refreshTokenOptions: jwt.SignOptions = { expiresIn: refreshTokenExpiry };

    const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        accessTokenSecret,
        accessTokenOptions
    );
    
    const refreshToken = jwt.sign(
        { id: user.id },
        refreshTokenSecret,
        refreshTokenOptions
    );
    
    await authService.updateUser(user.id, { refreshToken });

    return { accessToken, refreshToken };
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
};

// Traditional Auth
export const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, organizationName } = req.body;

    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await authService.createUser({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        organizationName,
    });

    // Remove password and refresh token from the response
    const createdUser = { ...user };
    delete createdUser.password;
    delete createdUser.refreshToken;

    res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.findUserByEmail(email);

    if (!user || !user.password) {
        throw new ApiError(404, "User does not exist or has signed up with a social account");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
    const loggedInUser = { ...user };
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;

    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

export const logoutUser = asyncHandler(async (req: AuthRequest, res) => {
    await authService.updateUser(req.user!.id, { refreshToken: undefined });

    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out"));
});

// Password Reset Flow
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await authService.findUserByEmail(email);
    if (!user) {
        // We don't want to reveal if a user exists
        res.status(200).json(new ApiResponse(200, {}, "If a user with that email exists, a password reset OTP has been sent."));
        return;
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    authService.createPasswordResetOTP(email, otp);

    const emailText = `Your password reset OTP for KiQi is: ${otp}. It is valid for 10 minutes.`;
    await sendEmail({
        to: user.email,
        subject: 'KiQi - Reset Your Password',
        text: emailText,
        html: `<p>${emailText}</p>`,
    });

    res.status(200).json(new ApiResponse(200, {}, "If a user with that email exists, a password reset OTP has been sent."));
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const isValidOTP = authService.verifyPasswordResetOTP(email, otp);
    if (!isValidOTP) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const user = await authService.findUserByEmail(email);
    if (!user) throw new ApiError(404, "User not found");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authService.updateUser(user.id, { password: hashedPassword });
    
    authService.clearPasswordResetOTP(email);

    res.status(200).json(new ApiResponse(200, {}, "Password has been reset successfully. Please log in."));
});

// Web3 Wallet Auth
// In a real app, the "nonce" should be stored and validated to prevent replay attacks.
const loginMessage = "Welcome to KiQi! Sign this message to log in. Nonce: ";

export const getWeb3LoginMessage = asyncHandler(async (req, res) => {
    const { address } = req.query;
    if (!address) throw new ApiError(400, "Wallet address is required");
    
    // Generate a secure, unique nonce for the user
    const nonce = crypto.randomBytes(16).toString('hex');
    // Store this nonce associated with the user's address with an expiry
    // For now, we'll just return it.
    await authService.updateUser(address as string, { loginNonce: nonce }) // This assumes we can find/create user by address temporarily
    
    const message = `${loginMessage}${nonce}`;
    res.status(200).json(new ApiResponse(200, { message }, "Message to sign for login"));
});

export const loginWithWallet = asyncHandler(async (req, res) => {
    const { address, signature } = req.body;

    // In a real app, retrieve the stored nonce for this address
    const tempNonce = "some-retrieved-nonce"; // Placeholder
    const message = `${loginMessage}${tempNonce}`;

    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new ApiError(401, "Signature verification failed.");
    }

    let user = await authService.findUserByWalletAddress(address);
    if (!user) {
        // If user doesn't exist, create a new one.
        // You might redirect them to a page to complete their profile (name, org, etc.).
        user = await authService.createUser({ walletAddress: address, firstName: 'Web3', lastName: 'User', organizationName: 'My Web3 Org' });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
    const loggedInUser = { ...user };
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;

    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Wallet login successful"));
});