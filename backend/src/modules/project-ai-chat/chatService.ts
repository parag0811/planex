import { buildChatPrompt } from "../ai/assisstant/buildChatPrompt";
import { parseAiResponse } from "../ai/assisstant/responseParser";
import { generateSection } from "../ai/plannerAgent";
import { getProjectSectionsService } from "../project-sections/section.service";
import { Section } from "./chatController";

interface ChatServiceParams {
  projectId: string;
  message: string;
  context?: {
    section?: Section;
  };
}

type AIResponse =
  | {
      type: "update";
      section: Section;
      content: any;
    }
  | {
      type: "suggestion";
      message: string;
    };

export const chatService = async ({
  projectId,
  message,
  context,
}: ChatServiceParams) => {
  const sections = await getProjectSectionsService(projectId);

  const prompt = buildChatPrompt({ message, sections, context });

  const raw = await generateSection(prompt);
  console.log("AI Raw" , raw)

  const parsed : AIResponse= parseAiResponse(raw);

  console.log("AI Parsed", parsed)


  if (
    parsed.type === "update" &&
    context?.section &&
    context.section !== "none"
  ) {
    parsed.section = context.section;
  }

  return parsed;
};
