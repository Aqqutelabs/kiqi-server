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
exports.isAuthenticated = exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const http_status_codes_1 = require("http-status-codes");
exports.verifyJWT = (0, AsyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('Auth Middleware - Headers:', req.headers);
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) || ((_b = req.header('Authorization')) === null || _b === void 0 ? void 0 : _b.replace('Bearer ', ''));
        console.log('Auth Middleware - Token:', token ? 'Present' : 'Missing');
        if (!token) {
            throw new ApiError_1.ApiError(401, 'Unauthorized request');
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Use _id from token for MongoDB lookup
        const user = yield User_1.UserModel.findById(decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken._id);
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Invalid Access Token');
        }
        req.user = user;
        next();
    }
    catch (error) {
        throw new ApiError_1.ApiError(401, error instanceof Error ? error.message : 'Invalid access token');
    }
}));
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                error: true,
                message: "Authorization token missing or malformed",
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Token is missing from authorization header",
            });
            return;
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "", (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
            if (err || !decoded || typeof decoded !== "object") {
                res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    message: "Invalid or expired token",
                });
                return;
            }
            try {
                // Fetch the full user object from database
                const userId = decoded._id || decoded.id;
                const user = yield User_1.UserModel.findById(userId);
                if (!user) {
                    res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                        message: "User not found",
                    });
                    return;
                }
                req.user = user;
                next();
            }
            catch (fetchError) {
                console.error('Error fetching user:', fetchError);
                res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message: "Error fetching user",
                });
            }
        }));
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR),
            error: err.message,
        });
    }
});
exports.isAuthenticated = isAuthenticated;
