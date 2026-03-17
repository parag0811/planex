import { generateSection } from "./plannerAgent";
import { buildIdeaPrompt } from "./promptBuilder";

export const runPlannerPipeline = async (idea: string) => {
  const ideaSection = await generateSection(buildIdeaPrompt(idea));

  return {
    idea: ideaSection,
  };
};
