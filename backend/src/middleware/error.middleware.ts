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

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
};


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
    const isThirdPartyOrRaw =
      error.name !== "Error" ||
      (error.message && (error.message.includes("{") || error.message.length > 200));

    message = isThirdPartyOrRaw
      ? "An unexpected error occurred while processing your request."
      : error.message || "Something went wrong";
  }

  const isOAuthCallback =
  req.originalUrl.includes("/google/callback") ||
  req.originalUrl.includes("/github/callback");

  if (req.accepts("html") && isOAuthCallback) {
    const frontendBaseUrl = getFrontendBaseUrl();
    const redirectUrl = `${frontendBaseUrl}/oauth-callback?error=${encodeURIComponent(message)}`;
    return res.redirect(redirectUrl);
  }

  return res.status(status).json({ status, message , data: error.data});
};

export default errorHandler;
