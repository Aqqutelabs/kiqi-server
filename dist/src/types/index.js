"use strict";
// Consolidated shared types used by server services
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.StatusCodes = void 0;
// --- Status Codes Utility ---
exports.StatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
};
// --- Custom Error Class ---
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
