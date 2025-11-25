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
exports.conversionController = void 0;
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const conversion_service_impl_1 = require("../services/impl/conversion.service.impl");
const Wallet_1 = require("../models/Wallet");
class ConversionController {
    constructor() {
        // Create conversion request (user)
        this.createRequest = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const user = req.user;
            const { amount, solanaWallet } = req.body;
            if (!solanaWallet) {
                return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, 'Solana wallet is required for conversion'));
            }
            const wallet = yield Wallet_1.Wallet.findOne({ user_id: user._id });
            if (!wallet)
                return res.status(404).json(new ApiResponse_1.ApiResponse(404, null, 'Wallet not found'));
            if (wallet.go_credits < amount)
                return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, 'Insufficient go credits'));
            const conversion = yield conversion_service_impl_1.conversionService.createRequest(user._id, amount, solanaWallet);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, conversion, 'Conversion request created and pending admin approval'));
        }));
        // List user's conversion history
        this.listUser = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const user = req.user;
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);
            const result = yield conversion_service_impl_1.conversionService.listUserRequests(user._id, page, limit);
            return res.json(new ApiResponse_1.ApiResponse(200, result, 'User conversions retrieved'));
        }));
        // Admin: list all requests
        this.listAll = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            // simple admin check
            if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
                return res.status(403).json(new ApiResponse_1.ApiResponse(403, null, 'Admin access required'));
            }
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 50);
            const result = yield conversion_service_impl_1.conversionService.listAllRequests(page, limit);
            return res.json(new ApiResponse_1.ApiResponse(200, result, 'All conversions retrieved'));
        }));
        // Admin: approve
        this.approve = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
                return res.status(403).json(new ApiResponse_1.ApiResponse(403, null, 'Admin access required'));
            }
            const { id } = req.params;
            const conversion = yield conversion_service_impl_1.conversionService.approveRequest(id, req.user._id);
            return res.json(new ApiResponse_1.ApiResponse(200, conversion, 'Conversion approved'));
        }));
        // Admin: reject
        this.reject = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user || !(req.user.role === 'admin' || req.user.isAdmin)) {
                return res.status(403).json(new ApiResponse_1.ApiResponse(403, null, 'Admin access required'));
            }
            const { id } = req.params;
            const { reason } = req.body;
            const conversion = yield conversion_service_impl_1.conversionService.rejectRequest(id, req.user._id, reason);
            return res.json(new ApiResponse_1.ApiResponse(200, conversion, 'Conversion rejected'));
        }));
    }
}
exports.conversionController = new ConversionController();
