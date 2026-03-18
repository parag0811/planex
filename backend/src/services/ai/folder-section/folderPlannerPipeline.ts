import { ApiSectionContent } from "../api-section/apiPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../plannerAgent";
import { buildFolderPrompt, FolderSectionContent } from "./folderPromptBuilder";

export const runFolderPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
  api: ApiSectionContent,
): Promise<FolderSectionContent> => {
  const folderStructure = await generateSection(
    buildFolderPrompt(idea, database, api),
  );

  return folderStructure;
};
