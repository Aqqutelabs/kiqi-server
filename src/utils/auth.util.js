"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateAccessToken(_id, email) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES || "30d";
    return jsonwebtoken_1.default.sign({ _id, email: email }, secret, {
        expiresIn: expiresIn,
    });
}
function generateRefreshToken(_id, email) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES || "7d";
    return jsonwebtoken_1.default.sign({ _id, email: email }, secret, {
        expiresIn: expiresIn,
    });
}
