import { ApiSectionContent } from "../api-section/apiPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";

export interface FolderNode {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
}

export interface FolderSectionContent {
  root: FolderNode[];
}

export const buildFolderPrompt = (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
  api: ApiSectionContent,
): string => `
You are a senior software architect.

Design a production-ready folder structure for a full-stack application.

========================
PRODUCT OVERVIEW
${idea.overview}

TECH STACK
Frontend: ${idea.suggested_tech_stack.frontend.join(", ")}
Backend: ${idea.suggested_tech_stack.backend.join(", ")}
Database: ${idea.suggested_tech_stack.database.join(", ")}

========================
DATABASE ENTITIES
${database.entities.map(e => `- ${e.name}`).join("\n")}

========================
API ROUTES
${api.rest.map(r => `- ${r.method} ${r.path}`).join("\n")}

========================

Your task:

Generate a scalable folder structure.

Requirements:

- Separate frontend and backend
- Backend must include:
  - controllers
  - services
  - routes
  - middleware
  - models or prisma
  - ai (for AI orchestration layer)
- Frontend must include:
  - components
  - pages or app
  - hooks
  - services/api layer
- Include config files (env, docker, etc.)
- Keep structure clean and modern

Return ONLY valid JSON.

Schema:

{
  "root": [
    {
      "name": "string",
      "type": "folder | file",
      "children": []
    }
  ]
}

Rules:

- Use realistic folder names
- Do not over-nest
- Keep it scalable for production
- Include only relevant files
`;