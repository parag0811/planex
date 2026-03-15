import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { Role } from "../generated/prisma/client";

interface ApiError extends Error {
  status: number;
}

interface ApiResponse<T = any> {
  status: number;
  message?: string;
  data?: T;
}

interface MemberRequest {
  email: string;
  role: Role;
}

export const inviteMember = async (
  req: Request<{ projectId: string }, {}, MemberRequest>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      const error = new Error("User doesnot exist.") as ApiError;
      error.status = 404;
      throw error;
    }

    await prisma.projectMember.create({
      data: {
        user_id: user?.id,
        role,
        project_id: Number(projectId),
      },
    });

    return res.json({ status: 200, message: "Invited User successfully." });
  } catch (error) {
    next(error);
  }
};

export const projectMembers = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const projectMembers = await prisma.projectMember.findMany({
      where: {
        project_id: Number(projectId),
      },
      include: {
        user: true,
      },
    });

    return res.json({ status: 200, data: projectMembers });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: Request<{ projectId: string; memberId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const { projectId, memberId } = req.params;

  await prisma.projectMember.delete({
    where: {
      user_id_project_id: {
        user_id: Number(memberId),
        project_id: Number(projectId),
      },
    },
  });

  return res.json({ status: 200, message: "User removed successfully." });
};
