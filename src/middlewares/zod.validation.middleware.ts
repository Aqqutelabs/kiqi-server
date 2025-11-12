import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validateRequest = (schema: AnyZodObject) => async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('Request body in validateRequest:', req.body); // Debug log to inspect the request body
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return next(new ApiError(400, `Validation failed: ${errorMessage}`));
        }
        return next(error);
    }
};