import { z } from "zod";

const DatabaseFieldType = [
  "uuid",
  "string",
  "text",
  "integer",
  "boolean",
  "datetime",
  "float",
  "json",
  "date",
  "timestamp",
  "decimal",
  "enum",
  "varchar"
] as const;

const DatabaseFieldSchema = z.object({
  name: z.string(),
  type: z.enum(DatabaseFieldType),
  required: z.boolean(),
  unique: z.boolean().optional(),
  description: z.string().optional(),
});


const DatabaseEntitySchema = z.object({
  name: z.string(),
  description: z.string(),
  fields: z.array(DatabaseFieldSchema),
});


const RelationType = ["one-to-one", "one-to-many", "many-to-one", "many-to-many"] as const;

const DatabaseRelationSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(RelationType),
  description: z.string().optional(),
});


const DatabaseIndexSchema = z.object({
  entity: z.string(),
  fields: z.array(z.string()),
  unique: z.boolean().optional(),
});

const DatabaseSectionContentSchema = z.object({
  entities: z.array(DatabaseEntitySchema),
  relationships: z.array(DatabaseRelationSchema),
  indexes: z.array(DatabaseIndexSchema).optional(),
});


const DatabasePromptOptionsSchema = z.object({
  isRegenerating: z.boolean().optional(),
  regenerationSeed: z.string().optional(),
  instruction: z.string().optional(),
});


export {
  DatabaseFieldSchema,
  DatabaseEntitySchema,
  DatabaseRelationSchema,
  DatabaseIndexSchema,
  DatabaseSectionContentSchema,
  DatabasePromptOptionsSchema,
};
