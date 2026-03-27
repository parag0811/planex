import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import { buildDatabasePrompt, DatabaseSectionContent } from "./dbPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";

export const runDatabasePipeline = async (
  idea: IdeaSectionContent,
): Promise<DatabaseSectionContent> => {
  const ideaContent = JSON.stringify(idea);

  const hash = crypto.createHash("sha256").update(ideaContent).digest("hex");

  const cacheKey = `db:${hash}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    const databaseSection = JSON.parse(cachedData);
    return databaseSection;
  }

  const databaseSection = await generateSection(buildDatabasePrompt(idea));

  await redis.set(cacheKey, JSON.stringify(databaseSection), "EX", 3600);

  return databaseSection;
};
