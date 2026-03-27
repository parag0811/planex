import { chatService } from "../project-ai-chat/chatService";
import { regenerateService } from "../ai/sections/regenerate-section/regenerateService";
import { runPlannerPipeline } from "../ai/sections/idea-section/ideaPlannerPipeline";
import { getSectionByTypeService } from "../project-sections/section.service";
import { TYPES } from "../../generated/prisma/enums";
import { runDatabasePipeline } from "../ai/sections/db-section/dbPlannerPipeline";
import { IdeaSectionContent } from "../ai/sections/idea-section/ideaPromptBuilder";
import { runApiPipeline } from "../ai/sections/api-section/apiPlannerPipeline";
import { DatabaseSectionContent } from "../ai/sections/db-section/dbPromptBuilder";
import { runFolderPipeline } from "../ai/sections/folder-section/folderPlannerPipeline";
import { ApiSectionContent } from "../ai/sections/api-section/apiPromptBuilder";

export const aiHandlers = {
  chat: async (data: any) => {
    const { projectId, message, context } = data;

    return await chatService({ projectId, message, context });
  },
  regen: async (data: any) => {
    const { projectId, section, instruction } = data;

    return await regenerateService({ projectId, section, instruction });
  },

  idea: async (data: any) => {
    const { idea } = data;

    return await runPlannerPipeline(idea);
  },
  database: async (data: any) => {
    const { projectId } = data;

    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    if (!ideaSection) throw new Error("Idea section missing");

    return await runDatabasePipeline(
      ideaSection.content as unknown as IdeaSectionContent,
    );
  },

  api: async (data: any) => {
    const { projectId } = data;

    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);

    if (!ideaSection || !dbSection) {
      throw new Error("Idea and Database must exist first");
    }

    return await runApiPipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      dbSection.content as unknown as DatabaseSectionContent,
    );
  },

  folder: async (data: any) => {
    const { projectId } = data;

    const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
    const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);
    const apiSection = await getSectionByTypeService(projectId, TYPES.API);

    if (!ideaSection || !dbSection || !apiSection) {
      throw new Error("Idea, Database, and API must exist first");
    }

    return await runFolderPipeline(
      ideaSection.content as unknown as IdeaSectionContent,
      dbSection.content as unknown as DatabaseSectionContent,
      apiSection.content as unknown as ApiSectionContent,
    );
  },
};
