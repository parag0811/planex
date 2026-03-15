import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { Project } from "../generated/prisma/client";

interface CreateProjectRequest {
  name: string;
}

interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

interface ApiError extends Error {
  status: number;
}

export const createProject = async (
  req: Request<{}, {}, CreateProjectRequest>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    const userId = String(req.user!.id);

    await prisma.project.create({
      data: {
        name: name,
        owner: {
          connect: { id: userId },
        },
      },
    });

    return res.status(201).json({ message: "Project created successfully." });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const userId = String(req.user!.id);

    const projects = await prisma.project.findMany({
      where: {
        OR: [{ owner_id: userId }, { members: { some: { user_id: userId } } }],
      },
      include: {
        owner: true,
      },
    });

    return res.status(200).json({
      message: "Project fetched successfully.",
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request<{ projectId: string }, {}, CreateProjectRequest>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    const { projectId } = req.params;

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: data,
    });

    return res.status(200).json({
      message: "Project updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    await prisma.project.delete({
      where: { id: projectId },
    });

    return res.status(200).json({ message: "Project deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const createProjectInviteLink = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {};

export const joinProjectByInvite = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {};
