import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";
import { DatabaseSectionContent } from "../db-section/dbPromptBuilder";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRoute {
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  request?: {
    body?: Record<string, string>;
    params?: Record<string, string>;
    query?: Record<string, string>;
  };
  response: {
    success: Record<string, string>;
  };
  authRequired: boolean;
}

export interface WebSocketEvent {
  name: string;
  description: string;
  payload: Record<string, string>;
}

export interface AuthFlow {
  type: "JWT" | "OAuth" | "Session";
  description: string;
  routes: string[];
}

export interface ApiSectionContent {
  rest: ApiRoute[];
  realtime?: WebSocketEvent[];
  auth: AuthFlow;
}

export const buildApiPrompt = (
    idea : IdeaSectionContent,
    database : DatabaseSectionContent
): string => `
You are a senior backend architect.

Design a complete API system for the following application.

========================
PRODUCT OVERVIEW
${idea.overview}

KEY FEATURES
${idea.key_features.map(f => `- ${f.name}`).join("\n")}

REQUIREMENTS
${idea.requirements.map(r => `- ${r}`).join("\n")}

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
` 