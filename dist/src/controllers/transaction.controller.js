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
exports.getUserTransactions = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const Transaction_1 = require("../models/Transaction");
// Return all transactions for the authenticated user
exports.getUserTransactions = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        return res.status(401).json(new ApiResponse_1.ApiResponse(401, null, 'Unauthorized'));
    // Fetch all transactions for this user, newest first
    const transactions = yield Transaction_1.Transaction.find({ user_id: userId }).sort({ dateCreated: -1 });
    return res.json(new ApiResponse_1.ApiResponse(200, transactions, 'User transactions retrieved'));
}));
exports.default = { getUserTransactions: exports.getUserTransactions };
