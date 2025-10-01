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
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const auth_service_impl_1 = require("../services/impl/auth.service.impl");
class AuthController {
    constructor() {
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
