import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import {
  buildDatabasePrompt,
  type DatabasePromptOptions,
  type DatabaseSectionContent,
} from "./dbPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

interface DatabasePipelineOptions extends DatabasePromptOptions {
  useCache?: boolean;
  cacheTtlSeconds?: number;
}

export const runDatabasePipeline = async (
  idea: IdeaSectionContent,
  options: DatabasePipelineOptions = {},
): Promise<DatabaseSectionContent> => {
  const ideaContent = JSON.stringify(idea);

  const useCache = options.useCache !== false;
  const cacheTtlSeconds = options.cacheTtlSeconds ?? DEFAULT_AI_CACHE_TTL_SECONDS;

  const hash = crypto.createHash("sha256").update(ideaContent).digest("hex");

  const cacheKey = `db:${hash}`;

  if (useCache) {
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const databaseSection = JSON.parse(cachedData);
      return databaseSection;
    }
  }

  const databaseSection = await generateSection(
    buildDatabasePrompt(idea, {
      ...(options.isRegenerating !== undefined
        ? { isRegenerating: options.isRegenerating }
        : {}),
      ...(options.regenerationSeed !== undefined
        ? { regenerationSeed: options.regenerationSeed }
        : {}),
      ...(options.instruction !== undefined
        ? { instruction: options.instruction }
        : {}),
    }),
  );

  if (useCache) {
    await redis.set(cacheKey, JSON.stringify(databaseSection), "EX", cacheTtlSeconds);
  }

  return databaseSection;
};
