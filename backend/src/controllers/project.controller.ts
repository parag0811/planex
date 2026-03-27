import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";

interface CreateProjectRequest {
  name: string;
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

export const getProjectById = async (
  req: Request<{ projectId: string }, {}, CreateProjectRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(200).json({ message: "Project loaded.", project });
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
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const error = new Error("Project not found") as AppError;
      error.status = 404;
      throw error;
    }

    if (
      project.inviteToken &&
      project.inviteTokenExpiry &&
      project.inviteTokenExpiry > new Date()
    ) {
      const slug = project.name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "");

      return res.status(200).json({
        message: "Invite link already active",
        inviteLink: `${process.env.FRONTEND_URL}/invite/${slug}/${project.inviteToken}`,
      });
    }

    const token = crypto.randomUUID();

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        inviteToken: token,
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const slug = updatedProject.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w-]/g, "");

    return res.status(200).json({
      message: "Invite Link generated.",
      inviteLink: `${process.env.FRONTEND_URL}/invite/${slug}/${token}`,
      expiresAt: updatedProject.inviteTokenExpiry,
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateInviteLink = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId;

    const token = crypto.randomUUID();

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        inviteToken: token,
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const slug = project.name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^\w-]/g, "");

    return res.status(200).json({
      inviteLink: `${process.env.FRONTEND_URL}/invite${slug}/${token}`,
    });
  } catch (error) {
    next(error);
  }
};

export const joinProjectByInvite = async (
  req: Request<{ token: string }, {}, {}>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const userId = String(req.user!.id);
    const { token } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        inviteToken: token,
        inviteTokenExpiry: { gt: new Date() },
      },
    });

    if (!project) {
      const error = new Error("Invalid or expired invite link.") as AppError;
      error.status = 400;
      throw error;
    }

    if (project.owner_id === userId) {
      return res.status(400).json({
        message: "Owner already belongs to the project.",
      });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: project.id,
        },
      },
    });

    if (existingMember) {
      return res.status(200).json({
        message: "User already joined this project.",
      });
    }

    await prisma.projectMember.create({
      data: {
        user_id: userId,
        project_id: project.id,
      },
    });

    return res.status(200).json({ message: "Joined project successfully." });
  } catch (error) {
    next(error);
  }
};
