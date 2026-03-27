import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";

interface ApiError extends Error {
  status: number;
}

interface ApiResponse<T = any> {
  message?: string;
  data?: T;
}

export const removProjectMember = async (
  req: Request<{ projectId: string; memberId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const updateProjectMemberRole = async (
  req: Request<
    { projectId: string; memberId: string },
    {},
    { role: "EDITOR" | "VIEWER" }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const updatedMember = await prisma.projectMember.update({
      where: {
        id: memberId,
      },
      data: {
        role,
      },
    });

    return res.status(200).json({
      message: "Member role updated successfully.",
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
};
