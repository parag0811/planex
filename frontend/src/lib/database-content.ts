import type {
  DatabaseContent,
  DatabaseEntity,
  DatabaseField,
  DatabaseIndex,
  DatabaseRelation,
} from "./schemas/database.schema";

export type {
  DatabaseContent,
  DatabaseEntity,
  DatabaseField,
  DatabaseIndex,
  DatabaseRelation,
} from "./schemas/database.schema";

export const EMPTY_DATABASE: DatabaseContent = {
  entities: [],
  relationships: [],
  indexes: [],
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const normalizeField = (value: unknown): DatabaseField => {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    name: asString(record.name),
    type: asString(record.type) || "string",
    required: typeof record.required === "boolean" ? record.required : true,
    unique: record.unique === true,
    description: asString(record.description),
  };
};

const normalizeEntity = (value: unknown): DatabaseEntity => {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    name: asString(record.name),
    description: asString(record.description),
    fields: Array.isArray(record.fields)
      ? record.fields.map(normalizeField)
      : [],
  };
};

const normalizeRelation = (value: unknown): DatabaseRelation => {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    from: asString(record.from),
    to: asString(record.to),
    type: asString(record.type),
    description: asString(record.description),
  };
};

const normalizeIndex = (value: unknown): DatabaseIndex => {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    entity: asString(record.entity),
    fields: asStringArray(record.fields),
    unique: record.unique === true,
  };
};

export const normalizeDatabase = (payload: unknown): DatabaseContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).content
      ? ((payload as Record<string, unknown>).content as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);

  return {
    entities: Array.isArray(source.entities)
      ? source.entities.map(normalizeEntity)
      : [],
    relationships: Array.isArray(source.relationships)
      ? source.relationships.map(normalizeRelation)
      : [],
    indexes: Array.isArray(source.indexes)
      ? source.indexes.map(normalizeIndex)
      : [],
  };
};

const SQL_TYPES: Record<string, string> = {
  uuid: "UUID",
  string: "VARCHAR(255)",
  varchar: "VARCHAR(255)",
  text: "TEXT",
  integer: "INTEGER",
  boolean: "BOOLEAN",
  datetime: "TIMESTAMP",
  timestamp: "TIMESTAMP",
  float: "DOUBLE PRECISION",
  json: "JSONB",
  date: "DATE",
  decimal: "DECIMAL(10, 2)",
  enum: "VARCHAR(50)",
};

export const buildSql = (content: DatabaseContent): string => {
  if (content.entities.length === 0) return "";

  const tables = content.entities.map((entity) => {
    const columns = entity.fields.map((field) => {
      const type = SQL_TYPES[field.type.toLowerCase()] ?? field.type.toUpperCase();
      const parts = [`  ${field.name} ${type}`];
      if (field.required) parts.push("NOT NULL");
      if (field.unique) parts.push("UNIQUE");
      return parts.join(" ");
    });

    return `CREATE TABLE ${entity.name} (\n${columns.join(",\n")}\n);`;
  });

  const relationComments = content.relationships.map(
    (relation) =>
      `-- ${relation.from} -> ${relation.to} (${relation.type})`,
  );

  const indexStatements = (content.indexes ?? [])
    .filter((index) => index.entity && index.fields.length > 0)
    .map((index) => {
      const unique = index.unique ? "UNIQUE " : "";
      const name = `${index.entity}_${index.fields.join("_")}_idx`;
      return `CREATE ${unique}INDEX ${name} ON ${index.entity} (${index.fields.join(", ")});`;
    });

  return [...tables, "", ...relationComments, ...indexStatements].join("\n");
};
