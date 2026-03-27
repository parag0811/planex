import { ApiSectionContent } from "../api-section/apiPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import { buildFolderPrompt, FolderSectionContent } from "./folderPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";

export const runFolderPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
  api: ApiSectionContent,
): Promise<FolderSectionContent> => {
  const ideaContent = JSON.stringify(idea);
  const dbContent = JSON.stringify(database);
  const apiContent = JSON.stringify(api);

  const hash = crypto
    .createHash("sha256")
    .update(`${ideaContent}::${dbContent}::${apiContent}`)
    .digest("hex");
  const cacheKey = `folder:${hash}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    const folderStructure = JSON.parse(cachedData);
    return folderStructure;
  }

  const folderStructure = await generateSection(
    buildFolderPrompt(idea, database, api),
  );

  await redis.set(cacheKey, JSON.stringify(folderStructure), "EX", 3600);

  return folderStructure;
};
