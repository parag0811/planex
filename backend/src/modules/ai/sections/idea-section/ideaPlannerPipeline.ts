import crypto from "crypto"
import redis from "../../../../db/redis";
import { generateSection } from "../../plannerAgent";
import { buildIdeaPrompt } from "./ideaPromptBuilder";

export const runPlannerPipeline = async (idea: string, isRegenerating: boolean = false) => {

  const hash = crypto.createHash("sha256").update(idea).digest("hex")
  
  const cacheKey = `idea:${hash}`;
  
  // Skip cache if regenerating
  if (!isRegenerating) {
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const ideaSection = JSON.parse(cachedData);
      return {
        idea : ideaSection
      };
    }
  }

  const ideaSection = await generateSection(buildIdeaPrompt(idea, isRegenerating));

  // Cache the result for future use
  await redis.set(cacheKey, JSON.stringify(ideaSection), "EX", 3600);

  return {
    idea: ideaSection,
  };
};
