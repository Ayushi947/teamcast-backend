import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '@/utils/error.handler';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            'Validation error: ' +
              error.errors
                .map((err) => `${err.path.join('.')}: ${err.message}`)
                .join('; ')
          )
        );
        return;
      }
      next(new ValidationError('Invalid request data'));
    }
  };
};
