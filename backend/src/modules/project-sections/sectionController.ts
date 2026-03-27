import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import {
  getProjectSectionsService,
  getSectionByTypeService,
  upsertSectionService,
} from "./sectionService";
import { TYPES } from "../../generated/prisma/enums";
import { ApiError } from "../../controllers/project.controller";
import { aiQueue } from "../../queues/aiQueue";
import redis from "../../db/redis";

interface QueueResponse {
  status: string;
  jobId?: string;
  data?: any;
}

export const getProjectSections = async (
  req: Request<{ projectId: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const sections = await getProjectSectionsService(projectId);

    return res.status(200).json({ data: sections });
  } catch (error) {
    next(error);
  }
};

export const getSectionByType = async (
  req: Request<{ projectId: string; type: TYPES }, {}, {}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId, type } = req.params;

    const section = await getSectionByTypeService(projectId, type as TYPES);

    return res.status(200).json({
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

export const upsertSection = async (
  req: Request<{ projectId: string; type: TYPES }, {}, { content: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId, type } = req.params;
    const { content } = req.body;

    const section = await upsertSectionService(
      projectId,
      type as TYPES,
      content,
    );

    return res.status(200).json({
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

export const generateIdeaSection = async (
  req: Request<{ projectId: string }, {}, { idea: string }>,
  res: Response<QueueResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { idea } = req.body;

    const hash = crypto.createHash("sha256").update(idea).digest("hex");

    const cacheKey = `idea:${hash}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const ideaSection = JSON.parse(cachedData);

      return res.status(200).json({
        status: "cached",
        data: ideaSection,
      });
    }

    const ideaJob = await aiQueue.add(
      "idea",
      {
        projectId,
        idea,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return res.status(200).json({
      status: "queued",
      jobId: ideaJob.id!,
    });
  } catch (error) {
    next(error);
  }
};

export const generateDatabaseSuggestion = async (
  req: Request<{ projectId: string }>,
  res: Response<QueueResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);

    if (!ideaSection) {
      const error = new Error("Idea section must be created first") as ApiError;
      error.status = 404;
      throw error;
    }

    const content = JSON.stringify(ideaSection.content);

    const hash = crypto.createHash("sha256").update(content).digest("hex");

    const cacheKey = `db:${hash}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const dbSection = JSON.parse(cachedData);

      return res.status(200).json({
        status: "cached",
        data: dbSection,
      });
    }

    const databaseJob = await aiQueue.add(
      "database",
      {
        projectId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return res.status(200).json({
      status: "queued",
      jobId: databaseJob.id!,
    });
  } catch (err) {
    next(err);
  }
};

export const generateApiSuggestion = async (
  req: Request<{ projectId: string }>,
  res: Response<QueueResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);

    if (!ideaSection || !dbSection) {
      const error = new Error("Idea and Database must exist first") as ApiError;
      error.status = 404;
      throw error;
    }

    const ideaContent = JSON.stringify(ideaSection.content);
    const dbContent = JSON.stringify(dbSection.content);

    const hash = crypto
      .createHash("sha256")
      .update(`${ideaContent}::${dbContent}`)
      .digest("hex");
    const cacheKey = `api:${hash}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const apiSection = JSON.parse(cachedData);

      return res.status(200).json({
        status: "cached",
        data: apiSection,
      });
    }

    const apiJob = await aiQueue.add(
      "api",
      {
        projectId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return res.status(200).json({ status: "queued", jobId: apiJob.id! });
  } catch (error) {
    next(error);
  }
};

export const generateFolderSuggestion = async (
  req: Request<{ projectId: string }>,
  res: Response<QueueResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;

    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);
    const apiSection = await getSectionByTypeService(projectId, TYPES.API);

    if (!ideaSection || !dbSection || !apiSection) {
      const error = new Error(
        "Idea, Database, and API must exist first",
      ) as ApiError;
      error.status = 404;
      throw error;
    }

    const ideaContent = JSON.stringify(ideaSection.content);
    const dbContent = JSON.stringify(dbSection.content);
    const apiContent = JSON.stringify(apiSection.content);

    const hash = crypto
      .createHash("sha256")
      .update(`${ideaContent}::${dbContent}::${apiContent}`)
      .digest("hex");
    const cacheKey = `folder:${hash}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const folderSection = JSON.parse(cachedData);

      return res.status(200).json({
        status: "cached",
        data: folderSection,
      });
    }

    const folderJob = await aiQueue.add(
      "folder",
      {
        projectId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return res.status(200).json({ status: "queued", jobId: folderJob.id! });
  } catch (error) {
    next(error);
  }
};

const sectionMap: Record<string, TYPES> = {
  idea: TYPES.IDEA,
  api: TYPES.API,
  database: TYPES.DATABASE,
  folder: TYPES.FOLDER,
};

export const regenerateSection = async (
  req: Request<
    { projectId: string },
    {},
    { instruction?: string; section: string }
  >,
  res: Response<QueueResponse>,
  next: NextFunction,
) => {
  try {
    const { projectId } = req.params;
    const { instruction, section } = req.body;

    // Validate section
    if (!section || !sectionMap[section.toLowerCase()]) {
      const error = new Error("Invalid section") as ApiError;
      error.status = 422;
      throw error;
    }

    const mappedSection = sectionMap[section.toLowerCase()];

    if (!mappedSection) {
      const error = new Error("Invalid section") as ApiError;
      error.status = 422;
      throw error;
    }

    const finalInstruction =
      instruction?.trim() ||
      "Improve quality, scalability, and production readiness";

    const regenerateJob = await aiQueue.add(
      "regen",
      {
        projectId,
        section: mappedSection,
        instruction: finalInstruction,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return res.status(200).json({
      status: "queued",
      jobId: regenerateJob.id!,
    });
  } catch (error) {
    next(error);
  }
};
