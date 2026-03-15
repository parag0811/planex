import prisma from "../../db/prisma";
import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
}

export const loadProject = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const projectId = req.params;

    if (!userId) {
      const error = new Error("Unauthorized") as ApiError;
      error.status = 401;
      throw error;
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
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
