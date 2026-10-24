export interface DatabaseField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  description?: string;
}

export interface DatabaseEntity {
  name: string;
  description: string;
  fields: DatabaseField[];
}

export interface DatabaseRelation {
  from: string;
  to: string;
  type: string;
  description?: string;
}

export interface DatabaseContent {
  entities: DatabaseEntity[];
  relationships: DatabaseRelation[];
  indexes?: Array<{ entity: string; fields: string[]; unique?: boolean }>;
}

export const EMPTY_DATABASE: DatabaseContent = {
  entities: [],
  relationships: [],
};

export const normalizeDatabase = (payload: unknown): DatabaseContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).content
      ? ((payload as Record<string, unknown>).content as Record<string, unknown>)
      : ((payload ?? {}) as Record<string, unknown>);

  const entities = Array.isArray(source.entities)
    ? source.entities
        .map((entity) => {
          const record = entity as Record<string, unknown>;
          const fields = Array.isArray(record.fields)
            ? record.fields
                .map((field) => {
                  const item = field as Record<string, unknown>;
                  return {
                    name: typeof item.name === "string" ? item.name : "",
                    type: typeof item.type === "string" ? item.type : "string",
                    required:
                      typeof item.required === "boolean" ? item.required : true,
                    unique: item.unique === true,
                    description:
                      typeof item.description === "string"
                        ? item.description
                        : "",
                  };
                })
                .filter((field) => field.name)
            : [];

          return {
            name: typeof record.name === "string" ? record.name : "",
            description:
              typeof record.description === "string"
                ? record.description
                : "",
            fields,
          };
        })
        .filter((entity) => entity.name)
    : [];

  const relationships = Array.isArray(source.relationships)
    ? source.relationships
        .map((relation) => {
          const record = relation as Record<string, unknown>;
          return {
            from: typeof record.from === "string" ? record.from : "",
            to: typeof record.to === "string" ? record.to : "",
            type: typeof record.type === "string" ? record.type : "",
            description:
              typeof record.description === "string"
                ? record.description
                : "",
          };
        })
        .filter((relation) => relation.from && relation.to)
    : [];

  return {
    entities,
    relationships,
    indexes: Array.isArray(source.indexes)
      ? (source.indexes as DatabaseContent["indexes"])
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

  return [...tables, "", ...relationComments].join("\n");
};
