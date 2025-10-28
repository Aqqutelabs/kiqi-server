// Helper function for delay with exponential backoff
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Custom error class for rate limits
export class RateLimitError extends Error {
    constructor(message: string, public retryAfter?: number) {
        super(message);
        this.name = 'RateLimitError';
    }
}

// Retry configuration
export const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
};

// Helper function to handle retries with exponential backoff
export async function withRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 1
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (error.response?.status === 429) {
            // Get retry-after header if available
            const retryAfter = parseInt(error.response.headers['retry-after']) * 1000 || 
                Math.min(RETRY_CONFIG.initialDelay * Math.pow(2, attempt), RETRY_CONFIG.maxDelay);

            if (attempt < RETRY_CONFIG.maxRetries) {
                console.log(`Rate limited. Retrying in ${retryAfter}ms... (Attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
                await sleep(retryAfter);
                return withRetry(operation, attempt + 1);
            }
            throw new RateLimitError(
                'Rate limit exceeded. Please try again later.',
                retryAfter
            );
        }
        throw error;
    }
}