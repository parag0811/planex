import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  userId: number;
}

interface AppError extends Error {
  status: number;
}

declare global {
  namespace Express {
    interface User {
      id: number;
    }
  }
}

const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("User is not authenticated.") as AppError;
    error.status = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];
  if (token == undefined) {
    const error = new Error("Token is not valid.") as AppError;
    error.status = 401;
    return next(error);
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as DecodedToken;
    req.user = { id: decodedToken.userId };
    next();
  } catch (err) {
    const error = err as AppError;
    error.status = 401;
    next(error);
  }
};

export default isAuth;
