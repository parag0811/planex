import { Request, Response, NextFunction } from "express";
import prisma from "../../db/prisma";
import bcrypt from "bcrypt";
import { User as PrismaUser } from "../../generated/prisma/client";
import { getSupabaseClient } from "../../utils/supabase";
import { normalizeEmailAddress } from "../../utils/email";
import { signAuthToken } from "../../utils/authToken";
import {
  RECOVERY_CODE_TTL_MS,
  createRecoveryCode,
  normalizeRecoveryCode,
} from "../../utils/recoveryCode";

interface UserRequest {
  name: string;
  email: string;
  password: string;
}

interface UserResponse<T = undefined> {
  token?: string;
  message: string;
  user?: T;
}

const getFrontendBaseUrl = (req: Request) => {
  return (
    process.env.FRONTEND_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
};

const invalidRecoveryError = () => {
  const error = new Error("Invalid email or recovery code.") as AppError;
  error.status = 400;
  return error;
};

export const registerUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmailAddress(req.body.email);

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      const error = new Error("User already exists.") as AppError;
      error.status = 409;
      throw error;
    }

    const encryptedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: encryptedPassword,
      },
    });

    return res.status(201).json({
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
    const { password } = req.body;
    const email = normalizeEmailAddress(req.body.email);

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      const error = new Error("Invalid email or password.") as AppError;
      error.status = 401;
      throw error;
    }

    if (!user.password) {
      const error = new Error("Use social login for this account.") as AppError;
      error.status = 400;
      throw error;
    }

    const rightPassword = await bcrypt.compare(password, user.password);
    if (!rightPassword) {
      const error = new Error("Invalid email or password.") as AppError;
      error.status = 401;
      throw error;
    }

    const token = signAuthToken(user.id);

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
    UserResponse<
      Pick<
        PrismaUser,
        | "id"
        | "name"
        | "email"
        | "avatarUrl"
        | "recoveryCodeExpiresAt"
        | "created_at"
      >
    >
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
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        recoveryCodeExpiresAt: true,
        created_at: true,
      },
    });

    if (!user) {
      const error = new Error("User not found.") as AppError;
      error.status = 404;
      throw error;
    }

    return res.status(200).json({ user, message: "User fetched" });
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

      const supabase = getSupabaseClient();
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

export const generateRecoveryCode = async (
  req: Request<{}, {}, {}>,
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
    const code = createRecoveryCode();
    const recoveryCodeHash = await bcrypt.hash(
      normalizeRecoveryCode(code),
      10,
    );
    const recoveryCodeExpiresAt = new Date(Date.now() + RECOVERY_CODE_TTL_MS);

    await prisma.user.update({
      where: { id: userId },
      data: { recoveryCodeHash, recoveryCodeExpiresAt },
    });

    return res.status(200).json({
      code,
      expiresAt: recoveryCodeExpiresAt.toISOString(),
      message:
        "Recovery code generated. Save it now; it will not be shown again.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request<
    {},
    {},
    { email: string; recoveryCode: string; password: string }
  >,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    const email = normalizeEmailAddress(req.body.email);
    const recoveryCode = normalizeRecoveryCode(req.body.recoveryCode);

    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user?.recoveryCodeHash ||
      !user.recoveryCodeExpiresAt ||
      user.recoveryCodeExpiresAt.getTime() < Date.now()
    ) {
      throw invalidRecoveryError();
    }

    const matches = await bcrypt.compare(
      recoveryCode,
      user.recoveryCodeHash,
    );

    if (!matches) {
      throw invalidRecoveryError();
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        recoveryCodeHash: null,
        recoveryCodeExpiresAt: null,
      },
    });

    const token = signAuthToken(user.id);

    return res.status(200).json({
      token,
      message: "Password updated. You are signed in.",
    });
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
    const token = signAuthToken(userId);

    const frontendBaseUrl = getFrontendBaseUrl(req);
    if (req.accepts("html")) {
      res.set("Cache-Control", "no-store");
      const redirectUrl = `${frontendBaseUrl}/oauth-callback#token=${encodeURIComponent(token)}&provider=github`;
      return res.redirect(redirectUrl);
    }

    return res.status(200).json({
      token,
      message: "Github login successful.",
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
    const token = signAuthToken(userId);

    const frontendBaseUrl = getFrontendBaseUrl(req);
    if (req.accepts("html")) {
      res.set("Cache-Control", "no-store");
      const redirectUrl = `${frontendBaseUrl}/oauth-callback#token=${encodeURIComponent(token)}&provider=google`;
      return res.redirect(redirectUrl);
    }

    return res.status(200).json({
      token,
      message: "Google login successful.",
    });
  } catch (error) {
    next(error);
  }
};
