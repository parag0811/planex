import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import {
  buildDatabasePrompt,
  type DatabasePromptOptions,
  type DatabaseSectionContent,
} from "./dbPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";
import { DatabaseSectionContentSchema } from "../../../../schemas/database.schema";

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

type AppError = Error & { status?: number; data?: unknown };

const createAppError = (message: string, status: number, data?: unknown) => {
  const error = new Error(message) as AppError;
  error.status = status;
  error.data = data;
  return error;
};

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
  const cacheTtlSeconds =
    options.cacheTtlSeconds ?? DEFAULT_AI_CACHE_TTL_SECONDS;

  const hash = crypto.createHash("sha256").update(ideaContent).digest("hex");

  const cacheKey = `db:${hash}`;

  if (useCache) {
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const databaseSection = DatabaseSectionContentSchema.safeParse(parsed);

      if (!databaseSection.success) {
         console.error("Cached AI Validation Failed:", databaseSection.error.issues);
         throw createAppError(
          "Failed to generate a valid AI response. Please try again.",
          422
        );
      }
      return databaseSection.data;
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

  const validatedDatabaseSection = DatabaseSectionContentSchema.safeParse(
    databaseSection,
  );

  if (!validatedDatabaseSection.success) {
    console.error("AI Validation Failed:", validatedDatabaseSection.error.issues);
    throw createAppError(
      "Failed to generate a valid AI response. Please try again.",
      422
    );
  }

  if (useCache) {
    await redis.set(
      cacheKey,
      JSON.stringify(validatedDatabaseSection.data),
      "EX",
      cacheTtlSeconds,
    );
  }

  return validatedDatabaseSection.data;
};
