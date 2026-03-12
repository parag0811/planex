import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  userId: string;
}

interface ApiResponse {
  status: number;
  message: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

const isAuth = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // const error = new Error("User is not authenticated.")
    // error.statusCode = 401
    // return next(error)
    return res.json({ status: 401, message: "User is not authenticated." });
  }

  const token = authHeader.split(" ")[1];
  if (token == undefined) {
    return res.json({ status: 401, message: "Token is not valid." });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as DecodedToken;
    req.user = { id: decodedToken.userId };
    next();
  } catch (error) {
    return res.json({ status: 401, message: "Invalid token" });
  }
};

export default isAuth;
