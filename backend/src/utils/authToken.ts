import jwt, { SignOptions } from "jsonwebtoken";

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error("JWT_SECRET is not configured.") as AppError;
    error.status = 500;
    throw error;
  }

  return secret;
};

export const signAuthToken = (userId: string): string => {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ||
      "7d") as NonNullable<SignOptions["expiresIn"]>,
  });
};
