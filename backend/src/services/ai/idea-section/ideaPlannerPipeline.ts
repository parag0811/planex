import { generateSection } from "../plannerAgent";
import { buildIdeaPrompt } from "./ideaPromptBuilder";

export const runPlannerPipeline = async (idea: string) => {
  const ideaSection = await generateSection(buildIdeaPrompt(idea));

  return {
    idea: ideaSection,
  };
};
