import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from "../utils/authToken";

interface DecodedToken extends JwtPayload {
  userId: string;
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

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch (err) {
    // Configuration errors must surface as a server error, not as a 401.
    return next(err);
  }

  try {
    const decodedToken = jwt.verify(token, secret) as DecodedToken;
    req.user = { id: String(decodedToken.userId) };
    next();
  } catch (err) {
    const error = err as AppError;
    error.status = 401;
    next(error);
  }
};

export default isAuth;
