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

const DEFAULT_AI_CACHE_TTL_SECONDS = 600;

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
      const folderStructure = JSON.parse(cachedData);
      return folderStructure;
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

  if (useCache) {
    await redis.set(cacheKey, JSON.stringify(folderStructure), "EX", cacheTtlSeconds);
  }

  return folderStructure;
};
