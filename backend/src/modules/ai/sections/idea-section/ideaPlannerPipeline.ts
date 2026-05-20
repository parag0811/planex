import crypto from "crypto";
import redis from "../../../../db/redis";
import { generateSection } from "../../plannerAgent";
import { buildIdeaPrompt, type IdeaPromptOptions } from "./ideaPromptBuilder";
import { IdeaSectionContentSchema } from "../../../../schemas/idea.schema";

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

type AppError = Error & { status?: number; data?: unknown };

const createAppError = (message: string, status: number, data?: unknown) => {
  const error = new Error(message) as AppError;
  error.status = status;
  error.data = data;
  return error;
};

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
  const cacheTtlSeconds =
    options.cacheTtlSeconds ?? DEFAULT_AI_CACHE_TTL_SECONDS;

  const hash = crypto.createHash("sha256").update(idea).digest("hex");

  const cacheKey = `idea:${hash}`;

  if (useCache) {
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const ideaSection = IdeaSectionContentSchema.safeParse(parsed);

      if (!ideaSection.success) {
        throw createAppError(
          "Cached idea section failed validation",
          422,
          ideaSection.error.issues,
        );
      }

      return { idea: ideaSection.data };
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

  const validatedIdeaSection = IdeaSectionContentSchema.safeParse(ideaSection);

  if (!validatedIdeaSection.success) {
    throw createAppError(
      "Idea section failed validation",
      422,
      validatedIdeaSection.error.issues,
    );
  }

  if (useCache) {
    await redis.set(
      cacheKey,
      JSON.stringify(validatedIdeaSection.data),
      "EX",
      cacheTtlSeconds,
    );
  }

  return { idea: validatedIdeaSection.data };
};
