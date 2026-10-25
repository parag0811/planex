import { z } from "zod";

/**
 * Mirrors backend/src/schemas/database.schema.ts. Keep both in sync.
 */

export const DATABASE_FIELD_TYPES = [
  "uuid",
  "string",
  "varchar",
  "text",
  "integer",
  "boolean",
  "datetime",
  "timestamp",
  "float",
  "json",
  "date",
  "decimal",
  "enum",
] as const;

export const DatabaseFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().optional().default(true),
  unique: z.boolean().optional(),
  description: z.string().optional(),
});

export const DatabaseEntitySchema = z.object({
  name: z.string(),
  description: z.string().optional().default(""),
  fields: z.array(DatabaseFieldSchema),
});

export const DatabaseRelationSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

export const DatabaseIndexSchema = z.object({
  entity: z.string(),
  fields: z.array(z.string()),
  unique: z.boolean().optional(),
});

export const DatabaseSectionContentSchema = z.object({
  entities: z.array(DatabaseEntitySchema),
  relationships: z.array(DatabaseRelationSchema),
  indexes: z.array(DatabaseIndexSchema).optional(),
});

export type DatabaseField = z.infer<typeof DatabaseFieldSchema>;
export type DatabaseEntity = z.infer<typeof DatabaseEntitySchema>;
export type DatabaseRelation = z.infer<typeof DatabaseRelationSchema>;
export type DatabaseIndex = z.infer<typeof DatabaseIndexSchema>;
export type DatabaseContent = z.infer<typeof DatabaseSectionContentSchema>;

const trimmed = (value: string) => value.trim();
const normalizeName = (value: string) => value.trim().toLowerCase();

/**
 * Structural validation matches the backend. The editor adds the rules needed
 * to produce a usable relational schema.
 */
export const DatabaseEditorSchema = DatabaseSectionContentSchema.superRefine(
  (value, ctx) => {
    if (value.entities.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["entities"],
        message: "Add at least one entity.",
      });
    }

    const entityNames = new Set<string>();

    value.entities.forEach((entity, entityIndex) => {
      const entityPath = ["entities", entityIndex] as const;

      if (!trimmed(entity.name)) {
        ctx.addIssue({
          code: "custom",
          path: [...entityPath, "name"],
          message: "Add an entity name.",
        });
      } else if (entityNames.has(normalizeName(entity.name))) {
        ctx.addIssue({
          code: "custom",
          path: [...entityPath, "name"],
          message: "Entity names must be unique.",
        });
      } else {
        entityNames.add(normalizeName(entity.name));
      }

      if (entity.fields.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: [...entityPath, "fields"],
          message: "Add at least one field.",
        });
      }

      const fieldNames = new Set<string>();

      entity.fields.forEach((field, fieldIndex) => {
        const fieldPath = [...entityPath, "fields", fieldIndex] as const;

        if (!trimmed(field.name)) {
          ctx.addIssue({
            code: "custom",
            path: [...fieldPath, "name"],
            message: "Add a field name.",
          });
        } else if (fieldNames.has(normalizeName(field.name))) {
          ctx.addIssue({
            code: "custom",
            path: [...fieldPath, "name"],
            message: "Field names must be unique within an entity.",
          });
        } else {
          fieldNames.add(normalizeName(field.name));
        }

        if (!trimmed(field.type)) {
          ctx.addIssue({
            code: "custom",
            path: [...fieldPath, "type"],
            message: "Choose a field type.",
          });
        }
      });
    });

    value.relationships.forEach((relation, relationIndex) => {
      const relationPath = ["relationships", relationIndex] as const;

      if (!trimmed(relation.from)) {
        ctx.addIssue({
          code: "custom",
          path: [...relationPath, "from"],
          message: "Choose the source entity.",
        });
      } else if (!entityNames.has(normalizeName(relation.from))) {
        ctx.addIssue({
          code: "custom",
          path: [...relationPath, "from"],
          message: "Source entity does not exist.",
        });
      }

      if (!trimmed(relation.to)) {
        ctx.addIssue({
          code: "custom",
          path: [...relationPath, "to"],
          message: "Choose the target entity.",
        });
      } else if (!entityNames.has(normalizeName(relation.to))) {
        ctx.addIssue({
          code: "custom",
          path: [...relationPath, "to"],
          message: "Target entity does not exist.",
        });
      }

      if (!trimmed(relation.type)) {
        ctx.addIssue({
          code: "custom",
          path: [...relationPath, "type"],
          message: "Add the relationship type.",
        });
      }
    });

    (value.indexes ?? []).forEach((index, indexIndex) => {
      const indexPath = ["indexes", indexIndex] as const;
      const entity = value.entities.find(
        (item) => normalizeName(item.name) === normalizeName(index.entity),
      );

      if (!trimmed(index.entity)) {
        ctx.addIssue({
          code: "custom",
          path: [...indexPath, "entity"],
          message: "Choose an entity for this index.",
        });
      } else if (!entity) {
        ctx.addIssue({
          code: "custom",
          path: [...indexPath, "entity"],
          message: "Index entity does not exist.",
        });
      }

      if (index.fields.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: [...indexPath, "fields"],
          message: "Select at least one field.",
        });
      } else if (entity) {
        const available = new Set(entity.fields.map((field) => normalizeName(field.name)));
        index.fields.forEach((field, fieldIndex) => {
          if (!available.has(normalizeName(field))) {
            ctx.addIssue({
              code: "custom",
              path: [...indexPath, "fields", fieldIndex],
              message: "Field does not exist on this entity.",
            });
          }
        });
      }
    });
  },
);

export type DatabaseFieldErrors = Record<string, string>;

export const getDatabaseFieldErrors = (
  error: z.ZodError,
): DatabaseFieldErrors => {
  const errors: DatabaseFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
};
