import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: any[] = [];

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    } else {
        // You might want to log the original error for debugging
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};