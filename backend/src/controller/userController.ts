import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { User } from "../generated/prisma/client";

// shape of incoming request body
interface CreateUserRequest {
  name?: string;
  email: string;
  password?: string;
}

// the shape of API responses
interface ApiResponse<T = undefined> {
  status: number;
  message: string;
  data?: T;
}

export const createUser = async (
  req: Request<{}, {}, CreateUserRequest>,  // req.body type
  res: Response<ApiResponse<User>>,         // what res.json() can return
  next: NextFunction,
) => {
  const { name, email, password } = req.body;

  const findUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (findUser) {
    return res.json({
      status: 400,
      message: "Email already taken. Please use another email.",
    });
  }

  const newUser = await prisma.user.create({
    data: {
      name: name ?? null,
      email: email,
      password: password ?? null,
    },
  });

  return res.json({ status: 200, data: newUser, message: "User created" });
};
