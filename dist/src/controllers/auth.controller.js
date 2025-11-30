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
exports.AuthController = void 0;
exports.getGoogleTokens = getGoogleTokens;
exports.verifyGoogleToken = verifyGoogleToken;
const http_status_codes_1 = require("http-status-codes");
const google_auth_library_1 = require("google-auth-library");
const auth_service_impl_1 = require("../services/impl/auth.service.impl");
class AuthController {
    constructor() {
        this.updateSenderEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('Update Sender Email - Request Body:', req.body);
                console.log('Update Sender Email - User:', req.user);
                // Get userId from req.user (set by auth middleware)
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                const { senderEmail } = req.body;
                if (!senderEmail) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Sender email is required"
                    });
                    return;
                }
                // Validate email format
                const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
                if (!emailRegex.test(senderEmail)) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Invalid sender email format"
                    });
                    return;
                }
                const { UserModel } = yield Promise.resolve().then(() => __importStar(require("../models/User")));
                const user = yield UserModel.findByIdAndUpdate(userId, { senderEmail }, { new: true });
                if (!user) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "User not found"
                    });
                    return;
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Sender email updated successfully",
                    user
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.login = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                const { accessToken, refreshToken, user } = yield this.authService.login({ email, password });
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: 'Login successful',
                    accessToken,
                    refreshToken,
                    user
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.createUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { firstName, lastName, email, password, organizationName } = req.body;
                const user = yield this.authService.createUser({ firstName, lastName, email, password, organizationName });
                const accessToken = this.authService.generateAccessTokenForUser(user);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: `User registered successfully. Email: ${user.email}`,
                    accessToken
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.googleSignIn = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { idToken } = req.body;
                if (!idToken) {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: true, message: 'idToken is required' });
                    return;
                }
                // Verify token with Google (log verification errors for debugging)
                let profile = null;
                try {
                    profile = yield verifyGoogleToken(idToken);
                }
                catch (verifyErr) {
                    console.error('Google token verification error:', (verifyErr === null || verifyErr === void 0 ? void 0 : verifyErr.message) || verifyErr);
                }
                if (!profile) {
                    res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ error: true, message: 'Invalid Google ID token' });
                    return;
                }
                const email = profile.email || '';
                const firstName = profile.given_name || profile.name || 'Unknown';
                const lastName = profile.family_name || '';
                const googleId = profile.sub || '';
                const { UserModel } = yield Promise.resolve().then(() => __importStar(require('../models/User')));
                let user = yield UserModel.findOne({ email });
                if (user) {
                    // update google id if missing
                    if (!user.googleId) {
                        user.googleId = googleId;
                        yield user.save();
                    }
                }
                else {
                    // create user with a random password (social login)
                    const randomPassword = Math.random().toString(36).slice(2, 12);
                    user = yield UserModel.create({
                        firstName,
                        lastName: lastName || ' ',
                        email,
                        password: randomPassword,
                        organizationName: '',
                        googleId
                    });
                }
                // generate tokens
                const accessToken = this.authService.generateAccessTokenForUser(user);
                const refreshToken = this.authService.generateRefreshTokenForUser(user);
                const userObj = user.toObject ? user.toObject() : user;
                if (userObj.password)
                    delete userObj.password;
                res.status(http_status_codes_1.StatusCodes.OK).json({ error: false, message: 'Signed in with Google', accessToken, refreshToken, user: userObj });
            }
            catch (err) {
                next(err);
            }
        });
        this.authService = new auth_service_impl_1.AuthServiceImpl();
    }
}
exports.AuthController = AuthController;
// Google OAuth2 client + helpers
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI || "https://gokiki.app");
function getGoogleTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const code = req.query.code || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.code);
        try {
            const { tokens } = yield googleClient.getToken(code);
            res.json({ success: true, tokens });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Token exchange failed" });
        }
    });
}
function verifyGoogleToken(idToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticket = yield googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        return ticket.getPayload();
    });
}
