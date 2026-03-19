import { TYPES } from "../../../generated/prisma/enums";
import { getSectionByTypeService } from "../../../modules/project-sections/sectionService";
import { parseAiResponse } from "../assistant/responseParser";
import { generateSection } from "../plannerAgent";
import { buildRegeneratePrompt } from "./regeneratePrompt";

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

  const prompt = buildRegeneratePrompt({
    section,
    content: existing.content,
    instruction,
  });

  const raw = await generateSection(prompt);  // reusing the generateSection

  const parsed = parseAiResponse(raw); // reusing the parser (assistant one)

  return parsed;
};