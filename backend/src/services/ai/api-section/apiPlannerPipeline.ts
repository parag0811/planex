// 1. REST endpoints (core CRUD)
// 2. Realtime APIs (WebSocket / subscriptions)
// 3. Auth flows
// 4. System-level APIs (health, config, etc.)

import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { generateSection } from "../plannerAgent";
import { ApiSectionContent, buildApiPrompt } from "./apiPromptBuilder";

export const runApiPipeline = async (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
): Promise<ApiSectionContent> => {
  const apiSection = await generateSection(buildApiPrompt(idea, database));

  return apiSection;
};
