import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

interface AppError extends Error {
  status?: number;
  data?: unknown;
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
    error.data = errors.array();
    return next(error);
  }
  next();
};
