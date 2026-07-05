import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface AppError extends Error {
  status?: number;
  data?: unknown;
  fieldErrors?: Record<string, string>;
}

interface ErrorResponse {
  status: number;
  message: string;
  data? : unknown;
  fieldErrors?: Record<string, string>;
}

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
};


const errorHandler = (
  error: AppError | ZodError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction,
) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, error);

  let status = 500;
  let message = "An unexpected error occurred while processing your request.";
  let fieldErrors: Record<string, string> | undefined = undefined;

  if (error instanceof ZodError) {
    status = 400;
    message = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ");
  } else {
    const appError = error as AppError;
    const prismaError = error as AppError & { code?: string };
    
    status = prismaError.code === "P1001" ? 503 : appError.status || 500;
    if (appError.fieldErrors) {
      fieldErrors = appError.fieldErrors;
    }

    if (prismaError.code === "P1001") {
      message = "Database unavailable. Please try again shortly.";
    } else if (status >= 500) {
      message = "Internal Server Error";
    } else if ((status === 401 || status === 403) && !appError.message) {
      message = "Authentication failed! Login Again.";
    } else if (appError.status !== undefined) {
      message = appError.message || "Something went wrong";
    }
  }

  const isOAuthCallback =
  req.originalUrl.includes("/google/callback") ||
  req.originalUrl.includes("/github/callback");

  if (req.accepts("html") && isOAuthCallback) {
    const frontendBaseUrl = getFrontendBaseUrl();
    const redirectUrl = `${frontendBaseUrl}/oauth-callback?error=${encodeURIComponent(message)}`;
    return res.redirect(redirectUrl);
  }

  const responsePayload: ErrorResponse = { status, message };
  if (fieldErrors) {
    responsePayload.fieldErrors = fieldErrors;
  }

  return res.status(status).json(responsePayload);
};

export default errorHandler;
