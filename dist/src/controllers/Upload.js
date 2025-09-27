"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * @desc    Controller to handle image upload confirmation
 * @route   POST /api/v1/upload
 * @access  Public
 */
const uploadImage = (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError_1.default('No file was uploaded. Please include a file in your request.', 400);
        }
        res.status(201).json({
            status: 'success',
            message: 'Image uploaded successfully.',
            data: {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadImage = uploadImage;
