import crypto from "crypto"
import redis from "../../../db/redis";
import { generateSection } from "../plannerAgent";
import { buildIdeaPrompt } from "./ideaPromptBuilder";

export const runPlannerPipeline = async (idea: string) => {

  const hash = crypto.createHash("sha256").update(idea).digest("hex")
  
  const cacheKey = `idea:${hash}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    const ideaSection = JSON.parse(cachedData);
    return {
      idea : ideaSection
    };
  }

  const ideaSection = await generateSection(buildIdeaPrompt(idea));

  await redis.set(cacheKey, JSON.stringify(ideaSection), "EX", 3600);

  return {
    idea: ideaSection,
  };
};
