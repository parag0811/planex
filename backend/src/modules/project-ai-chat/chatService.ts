import { buildChatPrompt } from "../ai/assisstant/buildChatPrompt";
import { parseAiResponse, type AiResponse } from "../ai/assisstant/responseParser";
import { generateSection } from "../ai/plannerAgent";
import { getProjectSectionsService, getSectionByTypeService } from "../project-sections/section.service";
import { TYPES } from "../../generated/prisma/enums";
import { Section } from "./chatController";

interface ChatServiceParams {
  projectId: string;
  message: string;
  context?: {
    section?: Section;
  };
}

export const chatService = async ({
  projectId,
  message,
  context,
}: ChatServiceParams): Promise<AiResponse> => {
  try {
    const sectionsData = await getProjectSectionsService(projectId);
    
    const sections: Record<string, any> = {};
    for (const section of sectionsData) {
      if (section.type) {
        sections[section.type.toLowerCase()] = section;
      }
    }
    
    let currentContent = null;
    if (context?.section && context.section !== "none") {
      const sectionTypeMap: Record<string, TYPES> = {
        idea: TYPES.IDEA,
        database: TYPES.DATABASE,
        api: TYPES.API,
        folder: TYPES.FOLDER,
      };
      
      const sectionType = sectionTypeMap[context.section.toLowerCase()];
      if (sectionType) {
        const currentSection = await getSectionByTypeService(projectId, sectionType);
        currentContent = currentSection?.content || null;
      }
    }

    const prompt = buildChatPrompt({ 
      message, 
      sections, 
      context,
      currentContent,
    });

    const raw = await generateSection(prompt);
    console.log("AI Raw Response:", raw);

    const parsed: AiResponse = parseAiResponse(raw);
    console.log("AI Parsed Response:", parsed);

    if (
      parsed.type === "update" &&
      context?.section &&
      context.section !== "none"
    ) {
      parsed.section = context.section;
    }

    return parsed;
  } catch (error) {
    console.error("Chat service error:", error);
    return {
      type: "suggestion",
      message: "An error occurred while processing your request. Please try again.",
    };
  }
};
