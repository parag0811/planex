import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { User } from "../generated/prisma/client";

// shape of incoming request body
interface CreateUserRequest {
  name?: string;
  email: string;
  password?: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

// the shape of API responses
interface ApiResponse<T = undefined> {
  status: number;
  message: string;
  data?: T;
}

export const fetchUsers = async (
  req: Request<{}, {}, {}>,
  res: Response<ApiResponse<User[]>>,
  next: NextFunction,
) => {
  const users = await prisma.user.findMany({});

  return res.json({ status: 200, data: users, message: "Users fetched" });
};

export const showUser = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response<ApiResponse<User>>,
  next: NextFunction,
) => {
  const { id } = req.params;
  const user = await prisma.user.findFirst({
    where: {
      id: Number(id),
    },
  });

  if (!user) {
    return res.json({ status: 404, message: "User not found" });
  }

  return res.json({ status: 200, data: user, message: "User fetched" });
};

export const createUser = async (
  req: Request<{}, {}, CreateUserRequest>, // req.body type
  res: Response<ApiResponse<User>>, // what res.json() can return
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

export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserRequest>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // Only send defined data
  const data: Record<string, string> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password !== undefined) data.password = password;

  await prisma.user.update({
    where: {
      id: Number(id),
    },
    data,
  });

  return res.json({ status: 200, message: "User updated" });
};

export const deleteUser = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const { id } = req.params;

  await prisma.user.delete({
    where: {
      id: Number(id),
    },
  });

   return res.json({ status: 200, message: "User deleted" });
};
