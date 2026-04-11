import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  data?: unknown;
}

interface ErrorResponse {
  status: number;
  message: string;
  data? : unknown
}

const errorHandler = (
  error: AppError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction,
) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, error);

  const prismaError = error as AppError & { code?: string };
  const status = prismaError.code === "P1001" ? 503 : error.status || 500;
  let message: string;

  if (prismaError.code === "P1001") {
    message = "Database unavailable. Please try again shortly.";
  } else if (status >= 500) {
    message = "Internal Server Error";
  } else if ((status === 401 || status === 403) && !error.message) {
    message = "Authentication failed! Login Again.";
  } else {
    message = error.message || "Something went wrong";
  }

  return res.status(status).json({ status, message , data: error.data});
};

export default errorHandler;
