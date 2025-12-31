"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRateLimit = exports.auditLog = exports.verifySuperAdmin = exports.verifyAdmin = exports.adminOnly = void 0;
const ApiError_1 = require("../utils/ApiError");
const http_status_codes_1 = require("http-status-codes");
const adminOnly = (req, res, next) => {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'super_admin') {
        console.log("REQ.USER:", req.user);
        return res.status(403).json({ message: 'Admins only' });
    }
    next();
};
exports.adminOnly = adminOnly;
/**
 * Admin verification middleware
 * Ensures user has admin/superuser role
 */
const verifyAdmin = (req, res, next) => {
    var _a;
    try {
        const user = req.user;
        if (!user) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Not authenticated');
        }
        // Check for admin role (support multiple role fields for flexibility)
        const isAdmin = user.role === 'admin' ||
            user.role === 'superuser' ||
            user.isAdmin === true ||
            ((_a = user.role) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'admin';
        if (!isAdmin) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied. Admin privileges required.');
        }
        // Add admin flag to request for logging
        req.isAdmin = true;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.verifyAdmin = verifyAdmin;
/**
 * Super admin verification middleware
 * For highly sensitive operations
 */
const verifySuperAdmin = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Not authenticated');
        }
        const isSuperAdmin = user.role === 'superuser' ||
            user.isSuperAdmin === true;
        if (!isSuperAdmin) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied. Super admin privileges required.');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.verifySuperAdmin = verifySuperAdmin;
/**
 * Audit logging middleware
 * Logs all admin actions for security and compliance
 */
const auditLog = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            var _a, _b;
            const logEntry = {
                timestamp: new Date().toISOString(),
                adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                adminEmail: (_b = req.user) === null || _b === void 0 ? void 0 : _b.email,
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
            }
            else {
                console.log('[ADMIN AUDIT]', logEntry);
            }
            // Restore original send
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.auditLog = auditLog;
/**
 * Rate limiting for admin endpoints
 * More generous than public endpoints
 */
const adminRateLimit = (maxRequests = 1000, windowMs = 60000) => {
    const requests = new Map();
    return (req, res, next) => {
        var _a, _b;
        const userId = (((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || req.ip);
        const now = Date.now();
        const userRequests = requests.get(userId) || [];
        // Remove old requests outside the window
        const recentRequests = userRequests.filter(time => now - time < windowMs);
        if (recentRequests.length >= maxRequests) {
            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS, 'Too many requests. Please try again later.');
        }
        recentRequests.push(now);
        requests.set(userId, recentRequests);
        next();
    };
};
exports.adminRateLimit = adminRateLimit;
exports.default = {
    verifyAdmin: exports.verifyAdmin,
    verifySuperAdmin: exports.verifySuperAdmin,
    auditLog: exports.auditLog,
    adminRateLimit: exports.adminRateLimit
};
