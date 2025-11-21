"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = require("multer");
const AppError_1 = __importDefault(require("../utils/AppError"));
const ApiError_1 = require("../utils/ApiError");
const errorHandler = (err, req, res, next) => {
    console.error('💥 ERROR 💥', err);
    // If body parsing failed, log raw body if available to aid debugging
    try {
        const anyReq = req;
        if (anyReq && anyReq.rawBody) {
            console.error('💥 Raw request body (captured):', anyReq.rawBody);
        }
    }
    catch (e) {
        // ignore logging errors
    }
    if (err instanceof ApiError_1.ApiError) {
        // Handle Google API quota/rate limit errors (status 429)
        if (err.statusCode === 429) {
            return res.status(429).json({
                status: 'error',
                message: err.message || 'Too Many Requests: Quota exceeded.',
                errors: err.errors || [],
            });
        }
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            errors: err.errors || [],
        });
    }
    if (err instanceof AppError_1.default) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }
    if (err instanceof multer_1.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                message: `File is too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.`,
            });
        }
        // Handle other multer errors if necessary
        return res.status(400).json({
            status: 'error',
            message: err.message,
        });
    }
    // For unexpected errors, send a generic message
    return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error. Something went very wrong!',
    });
};
exports.default = errorHandler;
