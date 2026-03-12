import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../generated/prisma/client";

interface AppError extends Error {
  status?: number;
}

interface UserRequest {
  email: string;
  password: string;
}

interface UserResponse<T = undefined> {
  token?: string;
  message: string;
  status: number;
  user?: T;
}

export const registerUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      const error = new Error("User already exists.") as AppError;
      error.status = 409;
      throw error;
    }

    const encryptedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email,
        password: encryptedPassword,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    return res.json({
      token: token,
      message: "User created successfully.",
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      const error = new Error("User not found.") as AppError;
      error.status = 404;
      throw error;
    }

    if (!user.password) {
      const error = new Error("Use social login for this account.") as AppError;
      error.status = 400;
      throw error;
    }

    const rightPassword = await bcrypt.compare(password, user.password);
    if (!rightPassword) {
      const error = new Error("Invalid Password.") as AppError;
      error.status = 409;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    return res.json({
      token: token,
      message: "Login successful.",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request<{}, {}, {}>,
  res: Response<UserResponse<Pick<User, "name" | "email" | "created_at">>>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User is not authenticated.") as AppError;
      error.status = 401;
      throw error;
    }

    const { id } = req.user;
    const user = await prisma.user.findFirst({
      where: {
        id: Number(id),
      },
      select: {
        name: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      const error = new Error("User not found.") as AppError;
      error.status = 404;
      throw error;
    }

    return res.json({ status: 200, user, message: "User fetched" });
  } catch (error) {
    next(error);
  }
};
