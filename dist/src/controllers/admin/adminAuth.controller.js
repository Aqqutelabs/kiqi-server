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
exports.adminLogout = exports.adminLogin = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../../models/User");
const AsyncHandler_1 = require("../../utils/AsyncHandler");
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Admin users may be identified by role = 'admin' in the same User table
        const user = yield User_1.UserModel.findOne({ email });
        if (!user || user.role !== "admin") {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "User must be an admin",
            });
        }
        // Since passwords are currently plain text
        const isValid = password === user.password;
        if (!isValid) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                message: "Invalid credentials",
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || "", { expiresIn: "1d" });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Admin logged in successfully",
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: err.message,
        });
    }
});
exports.adminLogin = adminLogin;
exports.adminLogout = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Only needed if you store refresh tokens in DB
    if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) {
        yield User_1.UserModel.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
    }
    res.status(200).json({
        message: "Admin logged out successfully",
    });
}));
