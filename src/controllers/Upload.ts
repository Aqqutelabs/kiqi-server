import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

/**
 * @desc    Controller to handle image upload confirmation
 * @route   POST /api/v1/upload
 * @access  Public
 */
export const uploadImage = (req: Request, res: Response, next: NextFunction) => {
  try {

    if (!req.file) {
      throw new AppError('No file was uploaded. Please include a file in your request.', 400);
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
  } catch (error) {
    next(error);
  }
};