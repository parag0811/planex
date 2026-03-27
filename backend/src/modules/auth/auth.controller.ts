import { Request, Response, NextFunction } from "express";
import prisma from "../../db/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User as PrismaUser } from "../../generated/prisma/client";
import supabase from "../../utils/supabase";

interface UserRequest {
  name?: string;
  email: string;
  password: string;
}

interface UserResponse<T = undefined> {
  token?: string;
  message: string;
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

    return res.status(201).json({
      token: token,
      message: "User created successfully.",
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

    return res.status(200).json({
      token: token,
      message: "Login successful.",
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request<{}, {}, {}>,
  res: Response<
    UserResponse<Pick<PrismaUser, "name" | "email" | "created_at">>
  >,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User is not authenticated.") as AppError;
      error.status = 401;
      throw error;
    }

    const userId = String(req.user.id);
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
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

    return res.status(201).json({ user, message: "User fetched" });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User is not authenticated.") as AppError;
      error.status = 401;
      throw error;
    }

    const userId = String(req.user.id);
    const { name } = req.body;
    const file = req.file;

    const data: { name?: string; avatarUrl?: string } = {};
    if (name !== undefined) data.name = name;

    if (file) {
      const ext = file.originalname.split(".").pop() || "png";
      const filePath = `${userId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatar")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        const error = new Error("Supabase Storage Error.") as AppError;
        error.status = 500;
        throw error;
      }

      data.avatarUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatar/${filePath}`;
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json({ message: "Updated User details.", status: 200 });
  } catch (error) {
    next(error);
  }
};

export const githubAuthController = (
  req: Request,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User is not authenticated.") as AppError;
      error.status = 401;
      throw error;
    }

    const userId = req.user.id;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      token,
      message: "Github login successfull.",
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuthController = (
  req: Request,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User is not authenticated.") as AppError;
      error.status = 401;
      throw error;
    }

    const userId = req.user.id;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      token,
      message: "Google login successfull.",
    });
  } catch (error) {
    next(error);
  }
};
