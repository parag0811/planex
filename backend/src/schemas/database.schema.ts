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

export interface DatabasePromptOptions {
  isRegenerating?: boolean;
  regenerationSeed?: string;
  instruction?: string;
}