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

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${label} exceeded ${timeoutMs}ms timeout`)), timeoutMs)
    )
  ]);
};

export const aiHandlers = {
  chat: async (data: any) => {
    const { projectId, message, context } = data;

    try {
      console.log(`🚀 [chat] Handler: Processing for project ${projectId}`);
      const result = await withTimeout(
        chatService({ projectId, message, context }),
        300000,
        "Chat service"
      );
      console.log(`✅ [chat] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [chat] Handler Error:`, errorMsg);
      console.error(`Stack:`, error instanceof Error ? error.stack : "No stack");
      throw error;
    }
  },
  regen: async (data: any) => {
    const { projectId, section, instruction } = data;

    try {
      console.log(`🚀 [regen] Handler: Processing section ${section} for project ${projectId}`);
      const result = await withTimeout(
        regenerateService({ projectId, section, instruction }),
        300000,
        "Regenerate service"
      );
      console.log(`✅ [regen] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [regen] Handler Error:`, errorMsg);
      console.error(`Stack:`, error instanceof Error ? error.stack : "No stack");
      throw error;
    }
  },

  idea: async (data: any) => {
    const { idea } = data;

    try {
      console.log(`🚀 [idea] Handler: Processing idea: ${idea.substring(0, 50)}...`);
      const result = await withTimeout(
        runPlannerPipeline(idea),
        300000,
        "Idea pipeline"
      );
      console.log(`✅ [idea] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [idea] Handler Error:`, errorMsg);
      console.error(`Stack:`, error instanceof Error ? error.stack : "No stack");
      throw error;
    }
  },
  database: async (data: any) => {
    const { projectId } = data;

    try {
      console.log(`🚀 [database] Handler: Processing for project ${projectId}`);
      const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
      if (!ideaSection) throw new Error("Idea section missing");

      console.log(`🚀 [database] Handler: Idea section loaded, calling pipeline...`);
      const result = await withTimeout(
        runDatabasePipeline(
          ideaSection.content as unknown as IdeaSectionContent,
        ),
        300000,
        "Database pipeline"
      );
      console.log(`✅ [database] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [database] Handler Error:`, errorMsg);
      console.error(`Stack:`, error instanceof Error ? error.stack : "No stack");
      throw error;
    }
  },

  api: async (data: any) => {
    const { projectId } = data;

    try {
      console.log(`🚀 [api] Handler: Processing for project ${projectId}`);
      const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
      const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);

      if (!ideaSection || !dbSection) {
        throw new Error("Idea and Database must exist first");
      }

      console.log(`🚀 [api] Handler: Sections loaded, calling pipeline...`);
      const result = await withTimeout(
        runApiPipeline(
          ideaSection.content as unknown as IdeaSectionContent,
          dbSection.content as unknown as DatabaseSectionContent,
        ),
        300000,
        "API pipeline"
      );
      console.log(`✅ [api] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [api] Handler Error:`, errorMsg);
      console.error(`Stack:`, error instanceof Error ? error.stack : "No stack");
      throw error;
    }
  },

  folder: async (data: any) => {
    const { projectId } = data;

    try {
      console.log(`🚀 [folder] Handler: Processing for project ${projectId}`);
      const ideaSection = await getSectionByTypeService(projectId, TYPES.IDEA);
      const dbSection = await getSectionByTypeService(projectId, TYPES.DATABASE);
      const apiSection = await getSectionByTypeService(projectId, TYPES.API);

      if (!ideaSection || !dbSection || !apiSection) {
        throw new Error("Idea, Database, and API must exist first");
      }

      console.log(`🚀 [folder] Handler: All sections loaded, calling pipeline...`);
      const result = await withTimeout(
        runFolderPipeline(
          ideaSection.content as unknown as IdeaSectionContent,
          dbSection.content as unknown as DatabaseSectionContent,
          apiSection.content as unknown as ApiSectionContent,
        ),
        300000,
        "Folder pipeline"
      );
      console.log(`✅ [folder] Handler: Completed successfully`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [folder] Handler Error:`, errorMsg);
      console.error(`Stack:`, error instanceof Error ? error.stack : "No stack");
      throw error;
    }
  },
};
