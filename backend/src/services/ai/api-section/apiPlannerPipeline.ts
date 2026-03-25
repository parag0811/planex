// 1. REST endpoints (core CRUD)
// 2. Realtime APIs (WebSocket / subscriptions)
// 3. Auth flows
// 4. System-level APIs (health, config, etc.)

import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../plannerAgent";
import { ApiSectionContent, buildApiPrompt } from "./apiPromptBuilder";
import crypto from "crypto";
import redis from "../../../db/redis";

export const runApiPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
): Promise<ApiSectionContent> => {
  const ideaContent = JSON.stringify(idea);
  const dbContent = JSON.stringify(database);

  const hash = crypto
    .createHash("sha256")
    .update(`${ideaContent}::${dbContent}`)
    .digest("hex");
  const cacheKey = `api:${hash}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    const apiSection = JSON.parse(cachedData);
    return apiSection;
  }

  const apiSection = await generateSection(buildApiPrompt(idea, database));

  await redis.set(cacheKey, JSON.stringify(apiSection), "EX", 3600);

  return apiSection;
};
