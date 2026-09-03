import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface AppError extends Error {
  status?: number;
  data?: unknown;
  fieldErrors?: Record<string, string>;
  code?: string;
}

interface ErrorResponse {
  status: number;
  message: string;
  data?: unknown;
  fieldErrors?: Record<string, string>;
}

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
};

const sanitizeErrorMessage = (rawMessage: string, status: number): string => {
  const lower = rawMessage.toLowerCase();

  // 1. Prisma & Database errors
  if (
    lower.includes("prisma") ||
    lower.includes("database server") ||
    lower.includes("can't reach database") ||
    lower.includes("connection pool") ||
    lower.includes("pg_") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout")
  ) {
    return "Database service is momentarily warming up. Please try again in a few seconds.";
  }

  // 2. Groq & AI rate limits or token overages
  if (
    lower.includes("rate_limit") ||
    lower.includes("rate limit") ||
    lower.includes("tpm") ||
    lower.includes("rpd") ||
    lower.includes("tokens per minute") ||
    lower.includes("requests per day")
  ) {
    return "AI generation rate limit reached. Please wait a moment before trying again.";
  }

  // 3. Groq connection or timeout
  if (lower.includes("groq") || lower.includes("timed out waiting for ai")) {
    return "AI generation timed out. Please try again.";
  }

  // 4. Filepath leaks or stack traces
  if (
    rawMessage.includes("/app/") ||
    rawMessage.includes("dist/") ||
    rawMessage.includes("src/") ||
    rawMessage.includes("node_modules") ||
    rawMessage.includes(" at ") ||
    rawMessage.includes("invocation in")
  ) {
    return "An unexpected server error occurred. Please try again.";
  }

  // 5. Default fallbacks by status
  if (status === 401) {
    return "You are not authenticated. Please log in to continue.";
  }
  if (status === 403) {
    return "You do not have permission to access this resource.";
  }
  if (status === 404) {
    return rawMessage.trim() || "The requested resource was not found.";
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  if (status >= 500) {
    return "An internal server error occurred. Please try again shortly.";
  }

  return rawMessage.trim() || "Something went wrong. Please try again.";
};

const errorHandler = (
  error: AppError | ZodError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction,
) => {
  const rawMsg = error instanceof Error ? error.message : String(error);
  console.error(`❌ [API Error] ${req.method} ${req.originalUrl}:`, rawMsg);

  let status = 500;
  let message = "An unexpected error occurred while processing your request.";
  let fieldErrors: Record<string, string> | undefined = undefined;

  if (error instanceof ZodError) {
    status = 400;
    message = error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
  } else {
    const appError = error as AppError;
    const errCode = appError.code || "";
    const isPrismaError =
      appError.name?.startsWith("Prisma") ||
      rawMsg.toLowerCase().includes("prisma") ||
      rawMsg.toLowerCase().includes("can't reach database");

    if (isPrismaError || errCode === "P1001" || errCode === "P1002" || errCode === "P1008") {
      status = 503;
      message = "Database service is momentarily warming up. Please try again in a few seconds.";
    } else if (errCode === "P2002") {
      status = 409;
      message = "A record with these unique details already exists.";
    } else if (errCode === "P2025") {
      status = 404;
      message = "The requested record was not found.";
    } else {
      status = appError.status || 500;
      message = sanitizeErrorMessage(rawMsg, status);
    }

    if (appError.fieldErrors) {
      fieldErrors = appError.fieldErrors;
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
