export type DatabaseFieldType =
  | "uuid"
  | "string"
  | "text"
  | "integer"
  | "boolean"
  | "datetime"
  | "float"
  | "json";

export interface DatabaseField {
  name: string;
  type: DatabaseFieldType;
  required: boolean;
  unique?: boolean;
  description?: string;
}

export interface DatabaseEntity {
  name: string;
  description: string;
  fields: DatabaseField[];
}

export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export interface DatabaseRelation {
  from: string;
  to: string;
  type: RelationType;
  description?: string;
}

export interface DatabaseIndex {
  entity: string;
  fields: string[];
  unique?: boolean;
}

export interface DatabaseSectionContent {
  entities: DatabaseEntity[];
  relationships: DatabaseRelation[];
  indexes?: DatabaseIndex[];
}

import { IdeaSectionContent } from "../idea-section/ideaPromptBuilder";

export const buildDatabasePrompt = (idea: IdeaSectionContent): string => `
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
          "type": "uuid | string | text | integer | boolean | datetime | float | json",
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
      "type": "one-to-one | one-to-many | many-to-many",
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