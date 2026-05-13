import crypto from "crypto";
import redis from "../../../../db/redis";
import { generateSection } from "../../plannerAgent";
import { buildIdeaPrompt, type IdeaPromptOptions } from "./ideaPromptBuilder";

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

interface IdeaPipelineOptions extends IdeaPromptOptions {
  useCache?: boolean;
  cacheTtlSeconds?: number;
}

export const runPlannerPipeline = async (
  idea: string,
  options: IdeaPipelineOptions = {},
) => {
  const isRegenerating = options.isRegenerating ?? false;
  const useCache = options.useCache !== false && !isRegenerating;
  const cacheTtlSeconds = options.cacheTtlSeconds ?? DEFAULT_AI_CACHE_TTL_SECONDS;

  const hash = crypto.createHash("sha256").update(idea).digest("hex");

  const cacheKey = `idea:${hash}`;

  if (useCache) {
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const ideaSection = JSON.parse(cachedData);
      return {
        idea: ideaSection,
      };
    }
  }

  const ideaSection = await generateSection(
    buildIdeaPrompt(idea, {
      ...(isRegenerating !== undefined ? { isRegenerating } : {}),
      ...(options.regenerationSeed !== undefined
        ? { regenerationSeed: options.regenerationSeed }
        : {}),
      ...(options.instruction !== undefined
        ? { instruction: options.instruction }
        : {}),
    }),
  );

  if (useCache) {
    await redis.set(cacheKey, JSON.stringify(ideaSection), "EX", cacheTtlSeconds);
  }

  return {
    idea: ideaSection,
  };
};
