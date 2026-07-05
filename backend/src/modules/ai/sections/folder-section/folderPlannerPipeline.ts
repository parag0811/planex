import { ApiSectionContent } from "../api-section/apiPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import {
  buildFolderPrompt,
  type FolderPromptOptions,
  type FolderSectionContent,
} from "./folderPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";
import { FolderSectionContentSchema } from "../../../../schemas/folder.schema";

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

type AppError = Error & { status?: number; data?: unknown };

const createAppError = (message: string, status: number, data?: unknown) => {
  const error = new Error(message) as AppError;
  error.status = status;
  error.data = data;
  return error;
};

interface FolderPipelineOptions extends FolderPromptOptions {
  useCache?: boolean;
  cacheTtlSeconds?: number;
}

export const runFolderPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
  api: ApiSectionContent,
  options: FolderPipelineOptions = {},
): Promise<FolderSectionContent> => {
  const ideaContent = JSON.stringify(idea);
  const dbContent = JSON.stringify(database);
  const apiContent = JSON.stringify(api);

  const useCache = options.useCache !== false;
  const cacheTtlSeconds = options.cacheTtlSeconds ?? DEFAULT_AI_CACHE_TTL_SECONDS;

  const hash = crypto
    .createHash("sha256")
    .update(`${ideaContent}::${dbContent}::${apiContent}`)
    .digest("hex");
  const cacheKey = `folder:${hash}`;
  if (useCache) {
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const folderStructure = FolderSectionContentSchema.safeParse(parsed);

      if (!folderStructure.success) {
        console.error("Cached AI Validation Failed:", folderStructure.error.issues);
        throw createAppError(
          "Failed to generate a valid AI response. Please try again.",
          422
        );
      }

      return folderStructure.data;
    }
  }

  const folderStructure = await generateSection(
    buildFolderPrompt(idea, database, api, {
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

  const validatedFolderStructure =
    FolderSectionContentSchema.safeParse(folderStructure);

  if (!validatedFolderStructure.success) {
    console.error("AI Validation Failed:", validatedFolderStructure.error.issues);
    throw createAppError(
      "Failed to generate a valid AI response. Please try again.",
      422
    );
  }

  if (useCache) {
    await redis.set(
      cacheKey,
      JSON.stringify(validatedFolderStructure.data),
      "EX",
      cacheTtlSeconds,
    );
  }

  return validatedFolderStructure.data;
};
