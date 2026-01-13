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
exports.getUserSocialAccounts = void 0;
const UserSocialAccount_1 = __importDefault(require("../models/UserSocialAccount"));
const getUserSocialAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield UserSocialAccount_1.default.find().lean();
        return res.json({
            message: "All social accounts retrieved successfully",
            count: accounts.length,
            accounts,
        });
    }
    catch (error) {
        console.error("Failed to get user social accounts:", error);
        return res.status(500).json({
            message: "Failed to retrieve accounts",
            error: error.message,
        });
    }
});
exports.getUserSocialAccounts = getUserSocialAccounts;
