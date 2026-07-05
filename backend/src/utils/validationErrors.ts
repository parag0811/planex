import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

interface AppError extends Error {
  status?: number;
  data?: unknown;
  fieldErrors?: Record<string, string>;
}

export const handleValidationErrors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error(
      "Validation failed. Enter fields correctly.",
    ) as AppError;
    error.status = 422;
    
    const fieldErrors: Record<string, string> = {};
    errors.array().forEach((err: any) => {
      if (err.type === 'field' && !fieldErrors[err.path]) {
        fieldErrors[err.path] = err.msg;
      } else if (!fieldErrors[err.param || err.path]) {
         // Fallback for older express-validator versions
         fieldErrors[err.param || err.path] = err.msg;
      }
    });
    
    error.fieldErrors = fieldErrors;
    return next(error);
  }
  next();
};
