// 1. REST endpoints (core CRUD)
// 2. Realtime APIs (WebSocket / subscriptions)
// 3. Auth flows
// 4. System-level APIs (health, config, etc.)

import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import {
  type ApiPromptOptions,
  type ApiSectionContent,
  buildApiPrompt,
} from "./apiPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";
import { ApiSectionContentSchema } from "../../../../schemas/api.schema";

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

type AppError = Error & { status?: number; data?: unknown };

const createAppError = (message: string, status: number, data?: unknown) => {
  const error = new Error(message) as AppError;
  error.status = status;
  error.data = data;
  return error;
};

interface ApiPipelineOptions extends ApiPromptOptions {
  useCache?: boolean;
  cacheTtlSeconds?: number;
}

export const runApiPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
  options: ApiPipelineOptions = {},
): Promise<ApiSectionContent> => {
  console.log(`🔌 runApiPipeline: Starting API generation...`);

    const ideaContent = JSON.stringify(idea);
    const dbContent = JSON.stringify(database);

    const hash = crypto
      .createHash("sha256")
      .update(`${ideaContent}::${dbContent}`)
      .digest("hex");

    const useCache = options.useCache !== false;
    const cacheTtlSeconds =
      options.cacheTtlSeconds ?? DEFAULT_AI_CACHE_TTL_SECONDS;

    const cacheKey = `api:${hash}`;

    if (useCache) {
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const apiSection = ApiSectionContentSchema.safeParse(parsed);

        if (!apiSection.success) {
          console.error("Cached AI Validation Failed:", apiSection.error.issues);
          throw createAppError(
            "Failed to generate a valid AI response. Please try again.",
            422
          );
        }

        return apiSection.data;
      }
    }

    console.log(`🔌 runApiPipeline: Building prompt...`);
    const prompt = buildApiPrompt(idea, database, {
      ...(options.isRegenerating !== undefined
        ? { isRegenerating: options.isRegenerating }
        : {}),
      ...(options.regenerationSeed !== undefined
        ? { regenerationSeed: options.regenerationSeed }
        : {}),
      ...(options.instruction !== undefined
        ? { instruction: options.instruction }
        : {}),
    });
    console.log(
      `🔌 runApiPipeline: Prompt length: ${prompt.length} chars, calling LLM...`,
    );

    const apiSection = await generateSection(prompt);
    const validatedApiSection = ApiSectionContentSchema.safeParse(apiSection);

    if (!validatedApiSection.success) {
      console.error("AI Validation Failed:", validatedApiSection.error.issues);
      throw createAppError(
        "Failed to generate a valid AI response. Please try again.",
        422
      );
    }

    if (useCache) {
      console.log(`🔌 runApiPipeline: Caching result...`);
      await redis.set(
        cacheKey,
        JSON.stringify(validatedApiSection.data),
        "EX",
        cacheTtlSeconds,
      );
    }

    console.log(`✅ runApiPipeline: Successfully completed`);
    return validatedApiSection.data;
};
