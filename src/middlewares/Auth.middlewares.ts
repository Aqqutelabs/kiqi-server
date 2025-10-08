import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/AsyncHandler';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

interface JwtPayload {
    
    id: string;
    email: string;
  
  }

export interface AuthRequest extends Request {
    user?: {
        _id?: string;
        id?: string;
        [key: string]: any;
    };
}

export const verifyJWT = asyncHandler(async (req: any  , res: Response, next: NextFunction) => {
    try {
        console.log('Auth Middleware - Headers:', req.headers);
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        console.log('Auth Middleware - Token:', token ? 'Present' : 'Missing');

        if (!token) {
            throw new ApiError(401, 'Unauthorized request');
        }

        const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
        // Use _id from token for MongoDB lookup
        const user = await UserModel.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid Access Token');
        }

        req.user = user;
        next();
    } catch (error: unknown) {
        throw new ApiError(401, error instanceof Error ? error.message : 'Invalid access token');
    }
});


export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: true,
        message: "Authorization token missing or malformed",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Token is missing from authorization header",
    });
      return;
    }


    jwt.verify(token, process.env.JWT_SECRET || "", (err, decoded) => {
      if (err || !decoded || typeof decoded !== "object") {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Invalid or expired token",
        });
        return;
      }

      // req.user = (decoded as JwtPayload).id;
      req.user = decoded;
      next();
    });
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      error: err.message,
    }); 
  }
  };