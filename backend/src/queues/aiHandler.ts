import { chatService } from "../modules/ai-assistant/chatService";
import { regenerateService } from "../services/ai/regenerate-section/regenerateService";
import { runPlannerPipeline } from "../services/ai/idea-section/ideaPlannerPipeline";
import { getSectionByTypeService } from "../modules/project-sections/sectionService";
import { TYPES } from "../generated/prisma/enums";
import { runDatabasePipeline } from "../services/ai/db-section/dbPlannerPipeline";
import { IdeaSectionContent } from "../services/ai/idea-section/ideaPromptBuilder";
import { runApiPipeline } from "../services/ai/api-section/apiPlannerPipeline";
import { DatabaseSectionContent } from "../services/ai/db-section/dbPromptBuilder";
import { runFolderPipeline } from "../services/ai/folder-section/folderPlannerPipeline";
import { ApiSectionContent } from "../services/ai/api-section/apiPromptBuilder";

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
