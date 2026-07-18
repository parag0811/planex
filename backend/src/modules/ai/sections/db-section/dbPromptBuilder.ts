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
You are a senior backend architect.

Using the following product specification, design a database schema.

PRODUCT OVERVIEW
${idea.overview}

KEY FEATURES
${idea.key_features
  .map((f) => `- ${f.name}: ${f.description}`)
  .join("\n")}

SYSTEM REQUIREMENTS
${idea.requirements.map((r) => `- ${r}`).join("\n")}

SUGGESTED DATABASE TECHNOLOGIES
${idea.suggested_tech_stack.database.join(", ")}

${options.isRegenerating ? `
REGENERATION MODE
- Produce a different schema while still satisfying the product requirements
- Avoid reusing the exact same entity names and field groupings when possible
` : ""}

${options.instruction ? `
USER INSTRUCTION:
${options.instruction}
` : ""}

${options.isRegenerating ? `
REGENERATION_ID: ${options.regenerationSeed || "none"}
` : ""}

Your task:
Design a relational database schema suitable for a modern backend application.

Return ONLY valid JSON.

Schema format:

{
  "entities": [
    {
      "name": "string",
      "description": "string",
      "fields": [
        {
          "name": "string",
          "type": "uuid | string | text | integer | boolean | datetime | float | json | date | timestamp | decimal | enum | varchar",
          "required": true,
          "unique": false,
          "description": "string"
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "EntityName",
      "to": "EntityName",
      "type": "one-to-one | one-to-many | many-to-one | many-to-many",
      "description": "string"
    }
  ],
  "indexes": [
    {
      "entity": "EntityName",
      "fields": ["fieldName"],
      "unique": false
    }
  ]
}

Rules:

Entities
- 3–8 entities maximum
- names must be singular (User, Project, Task)

Fields
- always include an id field (uuid)
- include createdAt and updatedAt when relevant
- avoid redundant fields

Relationships
- reflect realistic application relationships

Indexes
- include indexes for frequently queried fields like email, foreign keys

Return ONLY JSON.
`;