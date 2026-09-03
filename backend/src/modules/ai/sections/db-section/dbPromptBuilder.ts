import { z } from "zod";
import {
  DatabaseEntitySchema,
  DatabaseFieldSchema, 
  DatabaseIndexSchema, 
  DatabasePromptOptionsSchema, 
  DatabaseRelationSchema,
  DatabaseSectionContentSchema
} from "../../../../schemas/database.schema"


export type DatabaseField = z.infer<typeof DatabaseFieldSchema>


export type DatabaseEntity = z.infer<typeof DatabaseEntitySchema>

export type DatabaseRelation = z.infer<typeof DatabaseRelationSchema>


export type DatabaseIndex = z.infer<typeof DatabaseIndexSchema>


export type DatabaseSectionContent = z.infer<typeof DatabaseSectionContentSchema>


import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";

export type DatabasePromptOptions = z.infer<typeof DatabasePromptOptionsSchema>

export const buildDatabasePrompt = (
  idea: IdeaSectionContent,
  options: DatabasePromptOptions = {},
): string => `
You are a senior database architect.

Using the following product specification, design a concise, production-ready relational database schema.

PRODUCT OVERVIEW:
${idea.overview}

CORE FEATURES:
${idea.key_features.slice(0, 6).map((f) => `- ${f.name}: ${f.description}`).join("\n")}

TARGET DATABASE:
${idea.suggested_tech_stack.database.join(", ") || "PostgreSQL"}

${options.isRegenerating ? `
REGENERATION MODE:
- Produce an alternative valid schema structure
- Reorganize relationships or fields cleanly
` : ""}

${options.instruction ? `
USER INSTRUCTION:
${options.instruction}
` : ""}

${options.isRegenerating ? `REGENERATION_ID: ${options.regenerationSeed || "none"}` : ""}

Task:
Design 4 to 6 core relational entities that model this application completely without unnecessary bloat.

Requirements:
1. Entities: 4 to 6 primary tables (e.g. User, Project, Workspace, CoreResource, Member, AuditLog). Singular PascalCase names.
2. Fields: 4 to 6 essential fields per entity (always include 'id' with type 'uuid', relevant foreign keys, core data fields, and timestamps).
3. Relationships: Specify explicit 1:1, 1:N, or M:N relationships between the entities.
4. Indexes: Add 1-2 essential indexes on foreign keys or unique fields.

Return ONLY valid JSON matching this schema:

{
  "entities": [
    {
      "name": "User",
      "description": "User account and profile",
      "fields": [
        { "name": "id", "type": "uuid", "required": true, "unique": true, "description": "Primary key" },
        { "name": "email", "type": "string", "required": true, "unique": true, "description": "User email address" },
        { "name": "name", "type": "string", "required": true, "unique": false, "description": "Full name" },
        { "name": "createdAt", "type": "datetime", "required": true, "unique": false, "description": "Creation timestamp" }
      ]
    }
  ],
  "relationships": [
    {
      "from": "User",
      "to": "Project",
      "type": "one-to-many",
      "description": "User owns multiple projects"
    }
  ],
  "indexes": [
    {
      "entity": "User",
      "fields": ["email"],
      "unique": true
    }
  ]
}

Return ONLY JSON. No markdown codeblocks, no explanations.
`;