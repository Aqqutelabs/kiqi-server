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
const http_status_codes_1 = require("http-status-codes");
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
        this.authService = new auth_service_impl_1.AuthServiceImpl();
    }
}
exports.AuthController = AuthController;
// hpe
