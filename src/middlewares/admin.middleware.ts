import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from './Auth.middlewares';

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    console.log("REQ.USER:", req.user);
    return res.status(403).json({ message: 'Admins only' });
  }
  next();

/**
 * Admin verification middleware
 * Ensures user has admin/superuser role
 */
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        if (!user) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
        }

        // Check for admin role (support multiple role fields for flexibility)
        const isAdmin = 
            user.role === 'admin' || 
            user.role === 'superuser' ||
            (user as any).isAdmin === true ||
            (user as any).role?.toLowerCase() === 'admin';

        if (!isAdmin) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Access denied. Admin privileges required.'
            );
        }

        // Add admin flag to request for logging
        (req as any).isAdmin = true;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Super admin verification middleware
 * For highly sensitive operations
 */
export const verifySuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        if (!user) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Not authenticated');
        }

        const isSuperAdmin =
            user.role === 'superuser' ||
            (user as any).isSuperAdmin === true;

        if (!isSuperAdmin) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Access denied. Super admin privileges required.'
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Audit logging middleware
 * Logs all admin actions for security and compliance
 */
export const auditLog = (action: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const originalSend = res.send;

        res.send = function(data: any) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                adminId: req.user?._id,
                adminEmail: req.user?.email,
                action,
                method: req.method,
                path: req.path,
                ip: req.ip,
                statusCode: res.statusCode,
                body: req.body,
                params: req.params
            };

            // Log to console (in production, use proper logging service)
            if (res.statusCode >= 400) {
                console.error('[ADMIN AUDIT]', logEntry);
            } else {
                console.log('[ADMIN AUDIT]', logEntry);
            }

            // Restore original send
            return originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Rate limiting for admin endpoints
 * More generous than public endpoints
 */
export const adminRateLimit = (maxRequests: number = 1000, windowMs: number = 60000) => {
    const requests = new Map<string, number[]>();

    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = (req.user?._id?.toString() || req.ip) as string;
        const now = Date.now();
        const userRequests = requests.get(userId) || [];

        // Remove old requests outside the window
        const recentRequests = userRequests.filter(time => now - time < windowMs);

        if (recentRequests.length >= maxRequests) {
            throw new ApiError(
                StatusCodes.TOO_MANY_REQUESTS,
                'Too many requests. Please try again later.'
            );
        }

        recentRequests.push(now);
        requests.set(userId, recentRequests);

        next();
    };
}

export default {
    verifyAdmin,
    verifySuperAdmin,
    auditLog,
    adminRateLimit
};
