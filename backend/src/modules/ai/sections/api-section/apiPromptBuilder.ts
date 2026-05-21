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
You are a senior backend architect.

Design a complete API system for the following application.

========================
PRODUCT OVERVIEW
${idea.overview}

KEY FEATURES
${idea.key_features.map((f) => `- ${f.name}`).join("\n")}

REQUIREMENTS
${idea.requirements.map((r) => `- ${r}`).join("\n")}

========================
DATABASE SCHEMA

Entities:
${database.entities
  .map(
    (e) => `
- ${e.name}
  Fields: ${e.fields.map((f) => f.name + ":" + f.type).join(", ")}
`,
  )
  .join("\n")}

Relationships:
${database.relationships
  .map((r) => `- ${r.from} → ${r.to} (${r.type})`)
  .join("\n")}

${
  options.isRegenerating
    ? `
REGENERATION MODE
- Produce a fresh API design while keeping it consistent with the schema
- Avoid reusing identical route groupings and descriptions where possible
`
    : ""
}

${
  options.instruction
    ? `
USER INSTRUCTION:
${options.instruction}
`
    : ""
}

${
  options.isRegenerating
    ? `
REGENERATION_ID: ${options.regenerationSeed || "none"}
`
    : ""
}

========================

Your task:

Design a complete API layer including:

1. REST APIs
2. Authentication system
3. Realtime APIs (if applicable)

Return ONLY valid JSON.

Schema:

{
  "rest": [
    {
      "name": "string",
      "method": "GET | POST | PUT | PATCH | DELETE",
      "path": "/string",
      "description": "string",
      "request": {
        "body": { "field": "type" },
        "params": { "field": "type" },
        "query": { "field": "type" }
      },
      "response": {
        "success": { "field": "type" }
      },
      "authRequired": true
    }
  ],
  "realtime": [
    {
      "name": "string",
      "description": "string",
      "payload": { "field": "type" }
    }
  ],
  "auth": {
    "type": "JWT | OAuth | Session",
    "description": "string",
    "routes": ["/auth/login", "/auth/register"]
  }
}

Rules:

REST
- include CRUD routes for each major entity
- follow REST conventions
- use plural resource names (/users, /projects)

Auth
- must include login, register, and session handling

Realtime
- include only if relevant (notifications, updates)

Return ONLY JSON.
`;
