import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { Role } from "../generated/prisma/client";

interface ApiError extends Error {
  status: number;
}

interface ApiResponse<T = any> {
  message?: string;
  data?: T;
}

interface MemberRequest {
  email: string;
  role: Role;
}

export const projectMembers = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const projectMembers = await prisma.projectMember.findMany({
      where: {
        project_id: projectId,
      },
      include: {
        user: true,
      },
    });

    return res.status(200).json({ data: projectMembers });
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
        user_id: memberId,
        project_id: projectId,
      },
    },
  });

  return res.status(200).json({ message: "User removed successfully." });
};
