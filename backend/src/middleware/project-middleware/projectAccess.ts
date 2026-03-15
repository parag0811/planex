import prisma from "../../db/prisma";
import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
}

export const projectAccess = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = String(req.user!.id);
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      const error = new Error("Project not found") as ApiError;
      error.status = 404;
      throw error;
    }

    const membership = project.members.find((m) => m.user_id === userId);

    req.project = project;
    req.membership = membership;

    next();
  } catch (error) {
    next(error);
  }
};
