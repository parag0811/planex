import { ApiSectionContent } from "../api-section/apiPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { z } from "zod";
import {
  FolderNodeSchema,
  FolderPromptOptionsSchema,
  FolderSectionContentSchema,
} from "../../../../schemas/folder.schema";

export type FolderNode = z.infer<typeof FolderNodeSchema>;

export type FolderSectionContent = z.infer<typeof FolderSectionContentSchema>;

export type FolderPromptOptions = z.infer<typeof FolderPromptOptionsSchema>;

export const buildFolderPrompt = (
  idea: IdeaSectionContent,
  database?: DatabaseSectionContent,
  api?: ApiSectionContent,
  options: FolderPromptOptions = {},
): string => `
You are a senior software architect.

Design a clean, production-ready full-stack folder structure directly reflecting this product and technology stack.

PRODUCT OVERVIEW:
${idea.overview}

TECH STACK:
- Frontend: ${idea.suggested_tech_stack.frontend.join(", ") || "Next.js, TypeScript, Tailwind"}
- Backend: ${idea.suggested_tech_stack.backend.join(", ") || "Node.js, Express, TypeScript"}
- Database: ${idea.suggested_tech_stack.database.join(", ") || "PostgreSQL, Prisma"}
- Frameworks/Tools: ${idea.suggested_tech_stack.frameworks?.join(", ") || "Docker, Redis, BullMQ"}

CORE MODULES:
${database?.entities?.length ? database.entities.map((e) => `- ${e.name.toLowerCase()}`).join("\n") : idea.key_features.slice(0, 4).map((f) => `- ${f.name.toLowerCase()}`).join("\n")}

${options.isRegenerating ? `
REGENERATION MODE:
- Produce an alternative clean, production-ready directory layout
` : ""}

${options.instruction ? `
USER INSTRUCTION:
${options.instruction}
` : ""}

${options.isRegenerating ? `REGENERATION_ID: ${options.regenerationSeed || "none"}` : ""}

Task:
Generate a clean, scalable directory tree (2 to 3 levels deep max, ~15-25 total nodes).

Requirements:
1. Separate 'frontend' and 'backend' root folders (or monorepo structure).
2. Frontend structure matching the chosen tech (e.g., src/app, src/components, src/hooks, src/lib, package.json).
3. Backend structure matching the chosen tech (e.g., src/controllers, src/services, src/routes, src/middleware, prisma/schema.prisma, package.json).
4. Include top-level configuration files (e.g. docker-compose.yml, .env.example, README.md).
5. Do NOT over-nest. Keep it concise and practical.

Return ONLY valid JSON matching this schema:

{
  "root": [
    {
      "name": "frontend",
      "type": "folder",
      "children": [
        {
          "name": "src",
          "type": "folder",
          "children": [
            { "name": "app", "type": "folder", "children": [] },
            { "name": "components", "type": "folder", "children": [] }
          ]
        },
        { "name": "package.json", "type": "file" }
      ]
    },
    {
      "name": "backend",
      "type": "folder",
      "children": [
        {
          "name": "src",
          "type": "folder",
          "children": [
            { "name": "modules", "type": "folder", "children": [] },
            { "name": "server.ts", "type": "file" }
          ]
        },
        { "name": "package.json", "type": "file" }
      ]
    },
    { "name": "docker-compose.yml", "type": "file" }
  ]
}

Return ONLY JSON. No markdown codeblocks, no explanations.
`;