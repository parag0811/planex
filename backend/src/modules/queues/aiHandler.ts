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

type AiJobHandler = (data: any, signal?: AbortSignal) => Promise<any>;

export const aiHandlers: Record<string, AiJobHandler> = {
  chat: async (data, signal) => {
    const { projectId, message, context } = data;

    try {
      console.log(`🚀 [chat] Handler: Processing for project ${projectId}`);
      const result = await chatService({
        projectId,
        message,
        context,
        ...(signal ? { signal } : {}),
      });
      console.log(`✅ [chat] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Handler Error:`, errorMsg);
      throw error;
    }
  },

  regen: async (data, signal) => {
    const { projectId, section, instruction } = data;

    try {
      console.log(
        `🚀 [regen] Handler: Processing section ${section} for project ${projectId}`,
      );
      const result = await regenerateService({
        projectId,
        section,
        instruction,
        ...(signal ? { signal } : {}),
      });
      console.log(`✅ [regen] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [regen] Handler Error: ${errorMsg}`);
      throw error;
    }
  },

  idea: async (data, signal) => {
    const { idea, isRegenerating = false, instruction } = data;

    try {
      console.log(
        `🚀 [idea] Handler: Processing idea: ${idea.substring(0, 50)}...${
          isRegenerating ? " (regenerating)" : ""
        }`,
      );
      const result = await runPlannerPipeline(idea, {
        isRegenerating,
        useCache: !isRegenerating,
        instruction,
        ...(signal ? { signal } : {}),
      });
      console.log(`✅ [idea] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [idea] Handler Error: ${errorMsg}`);
      throw error;
    }
  },

  database: async (data, signal) => {
    const {
      projectId,
      isRegenerating = false,
      instruction,
      regenerationSeed,
    } = data;

    try {
      console.log(
        `🚀 [database] Handler: Processing for project ${projectId}`,
      );
      const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
      if (!ideaSection) throw new Error("Idea section missing");

      console.log(
        `🚀 [database] Handler: Idea section loaded, calling pipeline...`,
      );
      const result = await runDatabasePipeline(
        ideaSection.content as unknown as IdeaSectionContent,
        {
          isRegenerating,
          useCache: !isRegenerating,
          instruction,
          regenerationSeed,
          ...(signal ? { signal } : {}),
        },
      );
      console.log(`✅ [database] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [database] Handler Error: ${errorMsg}`);
      throw error;
    }
  },

  api: async (data, signal) => {
    const {
      projectId,
      isRegenerating = false,
      instruction,
      regenerationSeed,
    } = data;

    try {
      console.log(`🚀 [api] Handler: Processing for project ${projectId}`);
      const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
      const dbSection = await getSectionByTypeService(
        projectId,
        TYPES.DATABASE,
      );

      if (!ideaSection || !dbSection) {
        throw new Error("Idea and Database must exist first");
      }

      console.log(`🚀 [api] Handler: Sections loaded, calling pipeline...`);
      const result = await runApiPipeline(
        ideaSection.content as unknown as IdeaSectionContent,
        dbSection.content as unknown as DatabaseSectionContent,
        {
          isRegenerating,
          useCache: !isRegenerating,
          instruction,
          regenerationSeed,
          ...(signal ? { signal } : {}),
        },
      );
      console.log(`✅ [api] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [api] Handler Error: ${errorMsg}`);
      throw error;
    }
  },

  folder: async (data, signal) => {
    const {
      projectId,
      isRegenerating = false,
      instruction,
      regenerationSeed,
    } = data;

    try {
      console.log(`🚀 [folder] Handler: Processing for project ${projectId}`);
      const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
      const dbSection = await getSectionByTypeService(
        projectId,
        TYPES.DATABASE,
      );
      const apiSection = await getSectionByTypeService(projectId, TYPES.API);

      if (!ideaSection || !dbSection || !apiSection) {
        throw new Error("Idea, Database, and API must exist first");
      }

      console.log(
        `🚀 [folder] Handler: All sections loaded, calling pipeline...`,
      );
      const result = await runFolderPipeline(
        ideaSection.content as unknown as IdeaSectionContent,
        dbSection.content as unknown as DatabaseSectionContent,
        apiSection.content as unknown as ApiSectionContent,
        {
          isRegenerating,
          useCache: !isRegenerating,
          instruction,
          regenerationSeed,
          ...(signal ? { signal } : {}),
        },
      );
      console.log(`✅ [folder] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [folder] Handler Error: ${errorMsg}`);
      throw error;
    }
  },
};
