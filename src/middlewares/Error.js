"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const ApiError_1 = require("../utils/ApiError");
const errorMiddleware = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = [];
    if (err instanceof ApiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    else {
        // You might want to log the original error for debugging
        console.error(err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
exports.errorMiddleware = errorMiddleware;
