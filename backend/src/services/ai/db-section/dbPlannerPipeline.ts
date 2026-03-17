import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../plannerAgent";
import { buildDatabasePrompt, DatabaseSectionContent } from "./dbPromptBuilder";
// import { buildIdeaPrompt } from "./ideaPromptBuilder";

export const runDatabasePipeline = async (
  idea: IdeaSectionContent,
): Promise<DatabaseSectionContent> => {
  const databaseSection = await generateSection(buildDatabasePrompt(idea));

  return databaseSection;
};
