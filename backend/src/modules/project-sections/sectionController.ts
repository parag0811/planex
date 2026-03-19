import { Request, Response, NextFunction } from "express";
import {
  getProjectSectionsService,
  getSectionByTypeService,
  upsertSectionService,
} from "./sectionService";
import { TYPES } from "../../generated/prisma/enums";
import { runPlannerPipeline } from "../../services/ai/idea-section/ideaPlannerPipeline";
import { ApiError, ApiResponse } from "../../controllers/projectController";
import { runDatabasePipeline } from "../../services/ai/db-section/dbPlannerPipeline";
import { IdeaSectionContent } from "../../services/ai/idea-section/ideaPromptBuilder";
import { runApiPipeline } from "../../services/ai/api-section/apiPlannerPipeline";
import { DatabaseSectionContent } from "../../services/ai/db-section/dbPromptBuilder";
import { runFolderPipeline } from "../../services/ai/folder-section/folderPlannerPipeline";
import { ApiSectionContent } from "../../services/ai/api-section/apiPromptBuilder";
import { regenerateService } from "../../services/ai/regenerate-section/regenerateService";

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
  req: Request<{}, {}, { idea: string }>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { idea } = req.body;

    const result = await runPlannerPipeline(idea);

    return res.status(200).json({ message: "Loaded data", data: result });
  } catch (error) {
    next(error);
  }
};

export const generateDatabaseSuggestion = async (
  req: Request<{ projectId: string }>,
  res: Response<ApiResponse>,
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

    const databaseSuggestion = await runDatabasePipeline(
      ideaSection.content as unknown as IdeaSectionContent,
    );

    return res.status(200).json({
      data: databaseSuggestion,
      message: "Here is your DB suggestion.",
    });
  } catch (err) {
    next(err);
  }
};

export const generateApiSuggestion = async (
  req: Request<{ projectId: string }>,
  res: Response<ApiResponse>,
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

    const apiSuggestion = await runApiPipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      dbSection.content as unknown as DatabaseSectionContent,
    );

    return res
      .status(200)
      .json({ message: "API generated successfully", data: apiSuggestion });
  } catch (error) {
    next(error);
  }
};

export const generateFolderSuggestion = async (
  req: Request<{ projectId: string }>,
  res: Response<ApiResponse>,
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

    const folderSuggestion = await runFolderPipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      dbSection.content as unknown as DatabaseSectionContent,
      apiSection.content as unknown as ApiSectionContent,
    );

    return res
      .status(200)
      .json({ message: "Generated folder structure", data: folderSuggestion });
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
  res: Response<ApiResponse>,
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

    const mappedSection =
      sectionMap[section.toLowerCase()];

    if (!mappedSection) {
      const error = new Error("Invalid section") as ApiError;
      error.status = 422;
      throw error;
    }

    const finalInstruction =
      instruction?.trim() ||
      "Improve quality, scalability, and production readiness";

    const regenerateSuggestion = await regenerateService({
      projectId,
      section: mappedSection,
      instruction: finalInstruction,
    });

    return res.status(200).json({
      message: "Regenerated successfully",
      data: regenerateSuggestion,
    });
  } catch (error) {
    next(error);
  }
};
