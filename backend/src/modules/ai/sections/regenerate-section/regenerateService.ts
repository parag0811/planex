import crypto from "crypto";
import { TYPES } from "../../../../generated/prisma/enums";
import { getSectionByTypeService } from "../../../project-sections/section.service";
import { runPlannerPipeline } from "../idea-section/ideaPlannerPipeline";
import { runDatabasePipeline } from "../db-section/dbPlannerPipeline";
import { runApiPipeline } from "../api-section/apiPlannerPipeline";
import { runFolderPipeline } from "../folder-section/folderPlannerPipeline";
import { type IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { type DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { type ApiSectionContent } from "../api-section/apiPromptBuilder";

interface RegenSeviceParams {
    projectId : string,
    section : TYPES,
    instruction : string
}

export const regenerateService = async ({
  projectId,
  section,
  instruction,
} : RegenSeviceParams) => {
  const existing = await getSectionByTypeService(projectId, section);

  if (!existing) {
    throw new Error("Section not found");
  }

  const regenerationSeed = crypto.randomBytes(8).toString("hex");

  const hasObjectContent = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  if (section === TYPES.IDEA) {
    if (!hasObjectContent(existing.content)) {
      throw new Error("Idea content is missing or invalid");
    }

    const rawIdea = (existing.content as unknown as IdeaSectionContent).raw_idea;

    if (!rawIdea || typeof rawIdea !== "string") {
      throw new Error("Idea raw_idea is missing");
    }

    const result = await runPlannerPipeline(rawIdea, {
      isRegenerating: true,
      useCache: false,
      instruction,
      regenerationSeed,
    });

    return result.idea;
  }

  if (section === TYPES.DATABASE) {
    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);

    if (!ideaSection) {
      throw new Error("Idea section missing");
    }

    if (!hasObjectContent(ideaSection.content)) {
      throw new Error("Idea content is missing or invalid");
    }

    return await runDatabasePipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      {
        isRegenerating: true,
        useCache: false,
        instruction,
        regenerationSeed,
      },
    );
  }

  if (section === TYPES.API) {
    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);

    if (!ideaSection || !dbSection) {
      throw new Error("Idea and Database must exist first");
    }

    if (!hasObjectContent(ideaSection.content) || !hasObjectContent(dbSection.content)) {
      throw new Error("Idea or Database content is missing or invalid");
    }

    return await runApiPipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      dbSection.content as unknown as DatabaseSectionContent,
      {
        isRegenerating: true,
        useCache: false,
        instruction,
        regenerationSeed,
      },
    );
  }

  if (section === TYPES.FOLDER) {
    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);
    const apiSection = await getSectionByTypeService(projectId, TYPES.API);

    if (!ideaSection || !dbSection || !apiSection) {
      throw new Error("Idea, Database, and API must exist first");
    }

    if (
      !hasObjectContent(ideaSection.content) ||
      !hasObjectContent(dbSection.content) ||
      !hasObjectContent(apiSection.content)
    ) {
      throw new Error("Idea, Database, or API content is missing or invalid");
    }

    return await runFolderPipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      dbSection.content as unknown as DatabaseSectionContent,
      apiSection.content as unknown as ApiSectionContent,
      {
        isRegenerating: true,
        useCache: false,
        instruction,
        regenerationSeed,
      },
    );
  }

  throw new Error("Unsupported section type");
};