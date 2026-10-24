import { Request, Response, NextFunction } from "express";
import prisma from "../../db/prisma";

const getFrontendBaseUrl = (req: Request) => {
  return (
    process.env.FRONTEND_URL?.trim().replace(/\/$/, "") ||
    req.get("origin")?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
};

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

    const project = await prisma.project.create({
      data: {
        name: name,
        owner: {
          connect: { id: userId },
        },
      },
    });

    return res.status(201).json({
      message: "Project created successfully.",
      data: project,
    });
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
      // Never expose inviteToken/inviteTokenExpiry (or future sensitive
      // columns) on the project list. Invite links are owner-only.
      select: {
        id: true,
        name: true,
        owner_id: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        projectSections: {
          select: {
            type: true,
            content: true,
          },
        },
      },
    });

    // A section only exists once its preview has been accepted, so the number
    // of sections is also the number of approved blueprint stages.
    const data = projects.map(({ projectSections, ...project }) => {
      const idea = projectSections.find((section) => section.type === "IDEA");
      const content = idea?.content as Record<string, unknown> | null | undefined;
      const candidate = content?.raw_idea ?? content?.overview;
      const summary =
        typeof candidate === "string"
          ? candidate.trim().slice(0, 180)
          : null;

      return {
        ...project,
        summary,
        approvedStages: projectSections.length,
        sections: projectSections.map((section) => section.type),
      };
    });

    return res.status(200).json({
      message: "Project fetched successfully.",
      data,
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
    const userId = String(req.user!.id);

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
      include: {
        members: {
          select: {
            id: true,
            user_id: true,
            project_id: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        projectSections: {
          select: {
            type: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      const error = new Error("Project not found") as AppError;
      error.status = 404;
      throw error;
    }

    let inviteLink = null;
    if (
      project.inviteToken &&
      project.inviteTokenExpiry &&
      project.inviteTokenExpiry > new Date()
    ) {
      const frontendBaseUrl = getFrontendBaseUrl(req);
      const slug = project.name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "");
      inviteLink = `${frontendBaseUrl}/invite/${slug}/${project.inviteToken}`;
    }

    const { inviteToken, inviteTokenExpiry, projectSections, ...projectData } =
      project;
    const isOwner = project.owner_id === userId;

    return res.status(200).json({
      message: "Project loaded.",
      project: {
        ...projectData,
        sections: projectSections.map((section) => section.type),
        approvedStages: projectSections.length,
      },
      inviteLink: isOwner ? inviteLink : null,
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
      const frontendBaseUrl = getFrontendBaseUrl(req);
      const slug = project.name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\w-]/g, "");

      return res.status(200).json({
        message: "Invite link already active",
        inviteLink: `${frontendBaseUrl}/invite/${slug}/${project.inviteToken}`,
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
    const frontendBaseUrl = getFrontendBaseUrl(req);

    return res.status(200).json({
      message: "Invite Link generated.",
      inviteLink: `${frontendBaseUrl}/invite/${slug}/${token}`,
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
    const frontendBaseUrl = getFrontendBaseUrl(req);

    return res.status(200).json({
      inviteLink: `${frontendBaseUrl}/invite/${slug}/${token}`,
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
