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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = require("../../utils/ApiError");
const auth_util_1 = require("../../utils/auth.util");
const User_1 = require("../../models/User");
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
}
exports.AuthServiceImpl = AuthServiceImpl;
