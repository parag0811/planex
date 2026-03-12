import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../generated/prisma/client";

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

    if (!email || !password) {
      return res.json({ message: "Enter proper details", status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.json({ message: "User already exists", status: 409 });
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
  } catch (error) {}
};

export const loginUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ message: "Enter proper details", status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.json({ message: "User not found.", status: 404 });
    }

    if (!user.password) {
      return res.json({
        message: "Use social login for this account.",
        status: 400,
      });
    }

    const rightPassword = await bcrypt.compare(password, user.password);
    if (!rightPassword) {
      return res.json({ message: "Invalid Password.", status: 409 });
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
  } catch (error) {}
};

export const getUser = async (
  req: Request<{}, {}, {}>,
  res: Response<UserResponse<Pick<User, "name" | "email" | "created_at">>>,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.json({ status: 401, message: "User is not authenticated." });
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
    return res.json({ status: 404, message: "User not found" });
  }

  return res.json({ status: 200, user, message: "User fetched" });
};
