// 1. REST endpoints (core CRUD)
// 2. Realtime APIs (WebSocket / subscriptions)
// 3. Auth flows
// 4. System-level APIs (health, config, etc.)

import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../../plannerAgent";
import { ApiSectionContent, buildApiPrompt } from "./apiPromptBuilder";
import crypto from "crypto";
import redis from "../../../../db/redis";

export const runApiPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
): Promise<ApiSectionContent> => {
  try {
    console.log(`🔌 runApiPipeline: Starting API generation...`);
    
    const ideaContent = JSON.stringify(idea);
    const dbContent = JSON.stringify(database);

    const hash = crypto
      .createHash("sha256")
      .update(`${ideaContent}::${dbContent}`)
      .digest("hex");
    const cacheKey = `api:${hash}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log(`🔌 runApiPipeline: Using cached result`);
      const apiSection = JSON.parse(cachedData);
      return apiSection;
    }

    console.log(`🔌 runApiPipeline: Building prompt...`);
    const prompt = buildApiPrompt(idea, database);
    console.log(`🔌 runApiPipeline: Prompt length: ${prompt.length} chars, calling LLM...`);
    
    const apiSection = await generateSection(prompt);

    console.log(`🔌 runApiPipeline: Caching result...`);
    await redis.set(cacheKey, JSON.stringify(apiSection), "EX", 3600);

    console.log(`✅ runApiPipeline: Successfully completed`);
    return apiSection;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ runApiPipeline Error: ${errorMsg}`);
    console.error(`Stack:`, error instanceof Error ? error.stack : "No stack trace");
    throw error;
  }
};
