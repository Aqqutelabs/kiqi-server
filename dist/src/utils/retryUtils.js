"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETRY_CONFIG = exports.RateLimitError = exports.sleep = void 0;
exports.withRetry = withRetry;
// Helper function for delay with exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.sleep = sleep;
// Custom error class for rate limits
class RateLimitError extends Error {
    constructor(message, retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
// Retry configuration
exports.RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
};
// Helper function to handle retries with exponential backoff
function withRetry(operation_1) {
    return __awaiter(this, arguments, void 0, function* (operation, attempt = 1) {
        var _a;
        try {
            return yield operation();
        }
        catch (error) {
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
                // Get retry-after header if available
                const retryAfter = parseInt(error.response.headers['retry-after']) * 1000 ||
                    Math.min(exports.RETRY_CONFIG.initialDelay * Math.pow(2, attempt), exports.RETRY_CONFIG.maxDelay);
                if (attempt < exports.RETRY_CONFIG.maxRetries) {
                    console.log(`Rate limited. Retrying in ${retryAfter}ms... (Attempt ${attempt}/${exports.RETRY_CONFIG.maxRetries})`);
                    yield (0, exports.sleep)(retryAfter);
                    return withRetry(operation, attempt + 1);
                }
                throw new RateLimitError('Rate limit exceeded. Please try again later.', retryAfter);
            }
            throw error;
        }
    });
}
