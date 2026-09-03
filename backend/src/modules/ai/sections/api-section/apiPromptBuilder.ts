import { z } from "zod";
import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";
import {
  ApiPromptOptionsSchema,
  ApiRouteSchema,
  ApiSectionContentSchema,
  AuthFlowSchema,
  WebSocketEventSchema,
} from "../../../../schemas/api.schema";

export type ApiRoute = z.infer<typeof ApiRouteSchema>;

export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;

export type AuthFlow = z.infer<typeof AuthFlowSchema>;

export type ApiSectionContent = z.infer<typeof ApiSectionContentSchema>;

export type ApiPromptOptions = z.infer<typeof ApiPromptOptionsSchema>;

export const buildApiPrompt = (
  idea: IdeaSectionContent,
  database: DatabaseSectionContent,
  options: ApiPromptOptions = {},
): string => `
You are a senior API architect.

Design a clean, production-ready REST API specification with WebSockets matching this product and database model.

PRODUCT OVERVIEW:
${idea.overview}

DATABASE ENTITIES:
${database.entities.map((e) => `- ${e.name} (${e.fields.slice(0, 5).map((f) => f.name).join(", ")})`).join("\n")}

${options.isRegenerating ? `
REGENERATION MODE:
- Produce an alternative clean REST design consistent with the schema
` : ""}

${options.instruction ? `
USER INSTRUCTION:
${options.instruction}
` : ""}

${options.isRegenerating ? `REGENERATION_ID: ${options.regenerationSeed || "none"}` : ""}

Task:
Generate 8 to 12 core essential REST endpoints + 2 to 3 realtime events.

Requirements:
1. REST Routes:
   - Auth endpoints: POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me
   - Core Resource CRUD: 1-2 primary endpoints for each major database entity (e.g. GET /api/v1/projects, POST /api/v1/projects, GET /api/v1/projects/:id, PUT /api/v1/projects/:id, DELETE /api/v1/projects/:id)
   - Keep request and response examples concise (2-4 fields max).
2. Auth Flow: Specify JWT or OAuth strategy and list the protected routes.
3. Realtime: 2 to 3 essential WebSocket events (e.g. 'entity:created', 'notification:new').

Return ONLY valid JSON matching this schema:

{
  "rest": [
    {
      "name": "Register User",
      "method": "POST",
      "path": "/api/v1/auth/register",
      "description": "Register a new account",
      "request": {
        "body": { "email": "string", "password": "string", "name": "string" }
      },
      "response": {
        "success": { "token": "string", "user": { "id": "string", "email": "string" } }
      },
      "authRequired": false
    }
  ],
  "realtime": [
    {
      "name": "project:updated",
      "description": "Emitted when project data is modified",
      "payload": { "projectId": "string", "action": "string" }
    }
  ],
  "auth": {
    "type": "JWT",
    "description": "Bearer token authentication with JWT",
    "routes": ["/api/v1/projects", "/api/v1/tasks"]
  }
}

Return ONLY JSON. No markdown codeblocks, no explanations.
`;
