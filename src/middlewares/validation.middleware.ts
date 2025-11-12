import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: "Validation failed",
        details: errors.array(),
      });
    }
    next();
  };
  

export const registerValidator = [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('organizationName').notEmpty().withMessage('Organization name is required'),
    handleValidationErrors
];

export const loginValidator = [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

export const resetPasswordValidator = [
    body('email').isEmail().withMessage('Email must be valid'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    handleValidationErrors
];

export const walletLoginValidator = [
    body('address').isEthereumAddress().withMessage('A valid wallet address is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    handleValidationErrors
];

export const wordpressValidator = [
    body('publicUrl').isURL().withMessage('A valid public URL is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

export const chatbotValidator = [
    body('name').notEmpty().withMessage('Chatbot name is required'),
    body('theme').notEmpty().withMessage('Theme is required'),
    body('welcomeMessage').notEmpty().withMessage('Welcome message is required'),
    body('widgetPosition').isIn(['Left Top', 'Left Bottom', 'Right Top', 'Right Bottom']).withMessage('Invalid widget position'),
    body('tone').isIn(['Informal', 'Formal']).withMessage('Invalid tone'),
    handleValidationErrors
];

export const subscribeToPlanValidator = [
    body('planName').notEmpty().withMessage('Plan name is required'),
    handleValidationErrors
];

export const subscribeValidator = [
    body('planId').notEmpty().withMessage('Plan ID is required'),
    body('paymentMethod').isIn(['paystack', 'card']).withMessage('Invalid payment method. Must be either paystack or card'),
    handleValidationErrors
];