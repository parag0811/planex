import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import {  Project } from "../generated/prisma/client";

interface CreateProjectRequest {
  name: string;
}

interface CreateProjectResponse {
  message: string;
  status: number;
}

interface ApiError extends Error {
  status: number;
}

export const createProject = async (
  req: Request<{}, {}, CreateProjectRequest>,
  res: Response<CreateProjectResponse>,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (userId === undefined) {
      const error = new Error(
        "User id is not valid or user does not exist.",
      ) as ApiError;
      error.status = 404;
      throw error;
    }

    await prisma.project.create({
      data: {
        name: name,
        owner: {
          connect: { id: userId },
        },
      },
    });

    return res.json({ message: "Project created successfully.", status: 201 });
  } catch (error) {
    next(error);
  }
};

interface GetProjectsResponse {
  message: string;
  status: number;
  projects: Project[];
}

export const fetchProjects = async (
  req: Request,
  res: Response<GetProjectsResponse>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (userId === undefined) {
      const error = new Error(
        "User id is not valid or user does not exist.",
      ) as ApiError;
      error.status = 404;
      throw error;
    }
    const allOwnedProjects = await prisma.project.findMany({
      where: {
        owner_id: userId,
      },
    });

    return res.json({
      message: "Project fetched successfully.",
      status: 200,
      projects: allOwnedProjects,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request<{ projectId: string }, {}, CreateProjectRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    const { projectId } = req.params;

    if (userId === undefined) {
      const error = new Error(
        "User id is not valid or user does not exist.",
      ) as ApiError;
      error.status = 404;
      throw error;
    }

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;

    await prisma.project.update({
      where: {
        id: Number(projectId),
      },
      data: data,
    });

    return res.json({
      message: "Project updated successfully.",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (userId === undefined) {
      const error = new Error(
        "User id is not valid or user does not exist.",
      ) as ApiError;
      error.status = 404;
      throw error;
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
    });

    if (!project || project.owner_id !== userId) {
      const error = new Error(
        "Only project owner can delete this project.",
      ) as ApiError;
      error.status = 403;
      throw error;
    }

    await prisma.project.delete({
      where: {
        id: Number(projectId),
      },
    });

    return res.json({ message: "Project deleted successfully.", status: 200 });
  } catch (error) {
    next(error);
  }
};
