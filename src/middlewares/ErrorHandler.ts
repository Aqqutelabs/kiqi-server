// src/middlewares/errorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import AppError from '../utils/AppError';
import { ApiError } from '../utils/ApiError';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 ERROR 💥', err);

  if (err instanceof ApiError) {
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

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof MulterError) {
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

export default errorHandler;