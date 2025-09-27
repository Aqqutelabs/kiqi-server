"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotValidator = exports.wordpressValidator = exports.walletLoginValidator = exports.resetPasswordValidator = exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: true,
            message: "Validation failed",
            details: errors.array(),
        });
    }
    next();
};
exports.registerValidator = [
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email must be valid'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    (0, express_validator_1.body)('organizationName').notEmpty().withMessage('Organization name is required'),
    handleValidationErrors
];
exports.loginValidator = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email must be valid'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];
exports.resetPasswordValidator = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email must be valid'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    handleValidationErrors
];
exports.walletLoginValidator = [
    (0, express_validator_1.body)('address').isEthereumAddress().withMessage('A valid wallet address is required'),
    (0, express_validator_1.body)('signature').notEmpty().withMessage('Signature is required'),
    handleValidationErrors
];
exports.wordpressValidator = [
    (0, express_validator_1.body)('publicUrl').isURL().withMessage('A valid public URL is required'),
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];
exports.chatbotValidator = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Chatbot name is required'),
    (0, express_validator_1.body)('theme').notEmpty().withMessage('Theme is required'),
    (0, express_validator_1.body)('welcomeMessage').notEmpty().withMessage('Welcome message is required'),
    (0, express_validator_1.body)('widgetPosition').isIn(['Left Top', 'Left Bottom', 'Right Top', 'Right Bottom']).withMessage('Invalid widget position'),
    (0, express_validator_1.body)('tone').isIn(['Informal', 'Formal']).withMessage('Invalid tone'),
    handleValidationErrors
];
