"use client";

import { useMemo, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Database,
  Plus,
  Trash2,
  Sparkles,
  Save,
  RefreshCw,
  Link2,
  Rows3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";

type DatabaseFieldType =
  | "uuid"
  | "string"
  | "text"
  | "integer"
  | "boolean"
  | "datetime"
  | "float"
  | "json";

type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

interface DatabaseField {
  name: string;
  type: DatabaseFieldType;
  required: boolean;
  unique?: boolean;
  description?: string;
}

interface DatabaseEntity {
  name: string;
  description: string;
  fields: DatabaseField[];
}

interface DatabaseRelation {
  from: string;
  to: string;
  type: RelationType;
  description?: string;
}

interface DatabaseIndex {
  entity: string;
  fields: string[];
  unique?: boolean;
}

interface DatabaseSectionContent {
  entities: DatabaseEntity[];
  relationships: DatabaseRelation[];
  indexes?: DatabaseIndex[];
}

const FIELD_TYPES: DatabaseFieldType[] = [
  "uuid",
  "string",
  "text",
  "integer",
  "boolean",
  "datetime",
  "float",
  "json",
];

const RELATION_TYPES: RelationType[] = ["one-to-one", "one-to-many", "many-to-many"];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: EASE },
  },
});

const createEmptyField = (): DatabaseField => ({
  name: "",
  type: "string",
  required: false,
  unique: false,
  description: "",
});

const createEmptyEntity = (): DatabaseEntity => ({
  name: "Entity",
  description: "",
  fields: [
    { name: "id", type: "uuid", required: true, unique: true, description: "Primary key" },
    { name: "createdAt", type: "datetime", required: true, unique: false, description: "Created timestamp" },
  ],
});

const SAMPLE_SCHEMA: DatabaseSectionContent = {
  entities: [
    {
      name: "User",
      description: "Platform user account",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, description: "Primary key" },
        { name: "email", type: "string", required: true, unique: true, description: "Login email" },
        { name: "name", type: "string", required: true, unique: false, description: "Display name" },
        { name: "createdAt", type: "datetime", required: true, unique: false, description: "Created timestamp" },
      ],
    },
    {
      name: "Invoice",
      description: "Billing record",
      fields: [
        { name: "id", type: "uuid", required: true, unique: true, description: "Primary key" },
        { name: "title", type: "string", required: true, unique: false, description: "Invoice title" },
        { name: "amount", type: "float", required: true, unique: false, description: "Total amount" },
        { name: "paid", type: "boolean", required: true, unique: false, description: "Payment status" },
        { name: "userId", type: "uuid", required: true, unique: false, description: "Owner reference" },
        { name: "createdAt", type: "datetime", required: true, unique: false, description: "Created timestamp" },
      ],
    },
  ],
  relationships: [
    {
      from: "User",
      to: "Invoice",
      type: "one-to-many",
      description: "A user can have many invoices",
    },
  ],
  indexes: [
    { entity: "User", fields: ["email"], unique: true },
    { entity: "Invoice", fields: ["userId"], unique: false },
  ],
};

const normalizeSchema = (payload: unknown): DatabaseSectionContent | null => {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Partial<DatabaseSectionContent>;

  const entities = Array.isArray(raw.entities)
    ? (raw.entities
        .map((entity) => {
          if (!entity || typeof entity !== "object") return null;
          const source = entity as Partial<DatabaseEntity>;

          const fields = Array.isArray(source.fields)
            ? (source.fields
                .map((field) => {
                  if (!field || typeof field !== "object") return null;
                  const fieldSource = field as Partial<DatabaseField>;

                  if (
                    !fieldSource.name ||
                    typeof fieldSource.name !== "string" ||
                    !fieldSource.type ||
                    !FIELD_TYPES.includes(fieldSource.type as DatabaseFieldType)
                  ) {
                    return null;
                  }

                  return {
                    name: fieldSource.name,
                    type: fieldSource.type as DatabaseFieldType,
                    required: Boolean(fieldSource.required),
                    unique: Boolean(fieldSource.unique),
                    description:
                      typeof fieldSource.description === "string" ? fieldSource.description : "",
                  };
                })
                .filter(Boolean) as DatabaseField[])
            : [];

          if (!source.name || typeof source.name !== "string") return null;

          return {
            name: source.name,
            description: typeof source.description === "string" ? source.description : "",
            fields,
          };
        })
        .filter(Boolean) as DatabaseEntity[])
    : [];

  const relationships = Array.isArray(raw.relationships)
    ? (raw.relationships
        .map((relation) => {
          if (!relation || typeof relation !== "object") return null;
          const source = relation as Partial<DatabaseRelation>;

          if (
            typeof source.from !== "string" ||
            typeof source.to !== "string" ||
            !RELATION_TYPES.includes(source.type as RelationType)
          ) {
            return null;
          }

          return {
            from: source.from,
            to: source.to,
            type: source.type as RelationType,
            description: typeof source.description === "string" ? source.description : "",
          };
        })
        .filter(Boolean) as DatabaseRelation[])
    : [];

  const indexes = Array.isArray(raw.indexes)
    ? (raw.indexes
        .map((index) => {
          if (!index || typeof index !== "object") return null;
          const source = index as Partial<DatabaseIndex>;
          if (typeof source.entity !== "string" || !Array.isArray(source.fields)) return null;

          const fields = source.fields.filter(
            (field): field is string => typeof field === "string",
          );

          return {
            entity: source.entity,
            fields,
            unique: Boolean(source.unique),
          };
        })
        .filter(Boolean) as DatabaseIndex[])
    : [];

  if (entities.length === 0) return null;

  return {
    entities,
    relationships,
    indexes,
  };
};

export default function DatabasePage() {
  const [schema, setSchema] = useState<DatabaseSectionContent>(SAMPLE_SCHEMA);
  const [aiOpen, setAiOpen] = useState(true);
  const [indexExpanded, setIndexExpanded] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entityNames = useMemo(
    () => schema.entities.map((entity) => entity.name.trim()).filter(Boolean),
    [schema.entities],
  );

  const addEntity = () => {
    setSchema((current) => ({
      ...current,
      entities: [...current.entities, createEmptyEntity()],
    }));
    setStatus("Entity added.");
  };

  const updateEntity = (index: number, patch: Partial<DatabaseEntity>) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.map((entity, entityIndex) =>
        entityIndex === index ? { ...entity, ...patch } : entity,
      ),
    }));
  };

  const removeEntity = (index: number) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.filter((_, entityIndex) => entityIndex !== index),
    }));
    setStatus("Entity removed.");
  };

  const addField = (entityIndex: number) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.map((entity, idx) =>
        idx === entityIndex ? { ...entity, fields: [...entity.fields, createEmptyField()] } : entity,
      ),
    }));
  };

  const updateField = (
    entityIndex: number,
    fieldIndex: number,
    patch: Partial<DatabaseField>,
  ) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.map((entity, idx) => {
        if (idx !== entityIndex) return entity;
        return {
          ...entity,
          fields: entity.fields.map((field, idxField) =>
            idxField === fieldIndex ? { ...field, ...patch } : field,
          ),
        };
      }),
    }));
  };

  const removeField = (entityIndex: number, fieldIndex: number) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.map((entity, idx) => {
        if (idx !== entityIndex) return entity;
        return {
          ...entity,
          fields: entity.fields.filter((_, idxField) => idxField !== fieldIndex),
        };
      }),
    }));
  };

  const addRelationship = () => {
    setSchema((current) => ({
      ...current,
      relationships: [
        ...current.relationships,
        {
          from: entityNames[0] || "",
          to: entityNames[1] || entityNames[0] || "",
          type: "one-to-many",
          description: "",
        },
      ],
    }));
  };

  const updateRelationship = (index: number, patch: Partial<DatabaseRelation>) => {
    setSchema((current) => ({
      ...current,
      relationships: current.relationships.map((relation, idx) =>
        idx === index ? { ...relation, ...patch } : relation,
      ),
    }));
  };

  const removeRelationship = (index: number) => {
    setSchema((current) => ({
      ...current,
      relationships: current.relationships.filter((_, idx) => idx !== index),
    }));
  };

  const addIndex = () => {
    setSchema((current) => ({
      ...current,
      indexes: [
        ...(current.indexes ?? []),
        {
          entity: entityNames[0] || "",
          fields: [],
          unique: false,
        },
      ],
    }));
  };

  const updateIndex = (index: number, patch: Partial<DatabaseIndex>) => {
    setSchema((current) => ({
      ...current,
      indexes: (current.indexes ?? []).map((item, idx) =>
        idx === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeIndex = (index: number) => {
    setSchema((current) => ({
      ...current,
      indexes: (current.indexes ?? []).filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveDraft = () => {
    setStatus("Draft saved locally (frontend only).");
  };

  const handleRegenerate = () => {
    setSchema(SAMPLE_SCHEMA);
    setStatus("Regenerated local database draft.");
  };

  const handleApplySuggestion = (suggestion: ApplySuggestion) => {
    const normalized = normalizeSchema(suggestion.payload);
    if (!normalized) {
      setStatus("Suggestion could not be applied to database schema.");
      return;
    }

    setSchema(normalized);
    setStatus("Applied AI suggestion locally.");
  };

  const fieldOptionsByEntity = useMemo(
    () =>
      schema.entities.map((entity) => ({
        entity: entity.name,
        fields: entity.fields.map((field) => field.name).filter(Boolean),
      })),
    [schema.entities],
  );

  return (
    <div
      ref={scrollRef}
      className="flex w-full flex-1 overflow-y-auto overflow-x-hidden"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto">
        <motion.div
          className={`mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 transition-[padding-right] duration-300 ${
            aiOpen ? "lg:pr-85" : "lg:pr-0"
          }`}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fadeUp(0)}
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/8 bg-[#0b1019] px-4 py-3"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
              <span>Planex</span>
              <span>/</span>
              <span>{(schema.entities[1]?.name || "Project").toUpperCase()}</span>
              <span>/</span>
              <span className="text-white/80">DATABASE</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/20 hover:text-white/85"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
              <button
                onClick={handleSaveDraft}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Save size={12} />
                Save
              </button>
            </div>
          </motion.div>

          {status && (
            <div className="mb-4 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-200/90">
              {status}
            </div>
          )}

          <motion.div variants={fadeUp(1)} className="mb-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <Database size={20} className="text-orange-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold uppercase text-white">DATABASE</h1>
                  <p className="mt-1 text-sm text-white/45">
                    Model entities, relationships, and indexes for your backend.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(2)} className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white/90">Entities</h2>
              <button
                onClick={addEntity}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Plus size={12} />
                Add Entity
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {schema.entities.map((entity, entityIndex) => (
                <div
                  key={`${entity.name}-${entityIndex}`}
                  className="overflow-hidden rounded-md border border-white/8 bg-[#090e17]"
                >
                  <div className="border-b border-white/6 bg-white/4 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={entity.name}
                        onChange={(e) => updateEntity(entityIndex, { name: e.target.value })}
                        className="w-full bg-transparent text-lg font-bold text-white outline-none"
                        placeholder="Entity name"
                      />
                      <button
                        onClick={() => removeEntity(entityIndex)}
                        className="rounded-md p-1.5 text-white/35 transition hover:bg-white/8 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      value={entity.description}
                      onChange={(e) => updateEntity(entityIndex, { description: e.target.value })}
                      className="mt-2 w-full bg-transparent text-xs text-white/45 outline-none"
                      placeholder="Entity description"
                    />
                  </div>

                  <div className="p-3">
                    <div className="space-y-2">
                      {entity.fields.map((field, fieldIndex) => (
                        <div
                          key={`${field.name}-${fieldIndex}`}
                          className="rounded-md border border-white/6 bg-white/2 p-2.5"
                        >
                          <div className="grid grid-cols-12 gap-2">
                            <input
                              value={field.name}
                              onChange={(e) =>
                                updateField(entityIndex, fieldIndex, { name: e.target.value })
                              }
                              className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/80 outline-none md:col-span-3"
                              placeholder="fieldName"
                            />

                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateField(entityIndex, fieldIndex, {
                                  type: e.target.value as DatabaseFieldType,
                                })
                              }
                              className="col-span-6 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-blue-300 outline-none md:col-span-3"
                            >
                              {FIELD_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>

                            <label className="col-span-3 inline-flex items-center gap-1.5 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-[11px] text-white/70 md:col-span-2">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(entityIndex, fieldIndex, {
                                    required: e.target.checked,
                                  })
                                }
                              />
                              req
                            </label>

                            <label className="col-span-3 inline-flex items-center gap-1.5 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-[11px] text-white/70 md:col-span-2">
                              <input
                                type="checkbox"
                                checked={Boolean(field.unique)}
                                onChange={(e) =>
                                  updateField(entityIndex, fieldIndex, {
                                    unique: e.target.checked,
                                  })
                                }
                              />
                              unique
                            </label>

                            <button
                              onClick={() => removeField(entityIndex, fieldIndex)}
                              className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/45 transition hover:text-red-400 md:col-span-2"
                            >
                              remove
                            </button>

                            <input
                              value={field.description ?? ""}
                              onChange={(e) =>
                                updateField(entityIndex, fieldIndex, {
                                  description: e.target.value,
                                })
                              }
                              className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/55 outline-none"
                              placeholder="Field description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addField(entityIndex)}
                      className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-white/20 hover:text-white/90"
                    >
                      <Plus size={11} />
                      Add Field
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp(3)} className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white/90">
                <Link2 size={16} className="text-orange-400" />
                Relationships
              </h2>
              <button
                onClick={addRelationship}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Plus size={12} />
                Add Relationship
              </button>
            </div>

            <div className="space-y-2 rounded-md border border-white/8 bg-[#090e17] p-3">
              {schema.relationships.length === 0 && (
                <p className="px-1 py-2 text-sm text-white/35">No relationships yet.</p>
              )}

              {schema.relationships.map((relation, index) => (
                <div
                  key={`${relation.from}-${relation.to}-${index}`}
                  className="rounded-sm border border-white/7 bg-white/2 p-2.5"
                >
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={relation.from}
                      onChange={(e) => updateRelationship(index, { from: e.target.value })}
                      className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/80 outline-none md:col-span-3"
                    >
                      {entityNames.map((name) => (
                        <option key={`from-${name}`} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={relation.type}
                      onChange={(e) =>
                        updateRelationship(index, { type: e.target.value as RelationType })
                      }
                      className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-blue-300 outline-none md:col-span-3"
                    >
                      {RELATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    <select
                      value={relation.to}
                      onChange={(e) => updateRelationship(index, { to: e.target.value })}
                      className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/80 outline-none md:col-span-3"
                    >
                      {entityNames.map((name) => (
                        <option key={`to-${name}`} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeRelationship(index)}
                      className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/45 transition hover:text-red-400 md:col-span-3"
                    >
                      remove
                    </button>

                    <input
                      value={relation.description ?? ""}
                      onChange={(e) =>
                        updateRelationship(index, { description: e.target.value })
                      }
                      className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/55 outline-none"
                      placeholder="Relationship description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp(4)}>
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setIndexExpanded((current) => !current)}
                className="flex cursor-pointer items-center gap-2 text-xl font-bold text-white/90"
              >
                {indexExpanded ? (
                  <ChevronDown size={16} className="text-orange-400" />
                ) : (
                  <ChevronRight size={16} className="text-orange-400" />
                )}
                <Rows3 size={16} className="text-orange-400" />
                Indexes
              </button>

              <button
                onClick={addIndex}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Plus size={12} />
                Add Index
              </button>
            </div>

            {indexExpanded && (
              <div className="space-y-2 rounded-md border border-white/8 bg-[#090e17] p-3">
                {(schema.indexes ?? []).length === 0 && (
                  <p className="px-1 py-2 text-sm text-white/35">No indexes yet.</p>
                )}

                {(schema.indexes ?? []).map((item, index) => {
                  const selectedEntity = schema.entities.find(
                    (entity) => entity.name === item.entity,
                  );

                  return (
                    <div
                      key={`${item.entity}-${index}`}
                      className="rounded-sm border border-white/7 bg-white/2 p-2.5"
                    >
                      <div className="grid grid-cols-12 gap-2">
                        <select
                          value={item.entity}
                          onChange={(e) => updateIndex(index, { entity: e.target.value, fields: [] })}
                          className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/80 outline-none md:col-span-4"
                        >
                          {entityNames.map((name) => (
                            <option key={`index-entity-${name}`} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.fields[0] ?? ""}
                          onChange={(e) => updateIndex(index, { fields: e.target.value ? [e.target.value] : [] })}
                          className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/80 outline-none md:col-span-4"
                        >
                          <option value="">Select field</option>
                          {(selectedEntity?.fields ?? []).map((field) => (
                            <option key={`index-field-${field.name}`} value={field.name}>
                              {field.name}
                            </option>
                          ))}
                        </select>

                        <label className="col-span-6 inline-flex items-center gap-1.5 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-[11px] text-white/70 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={Boolean(item.unique)}
                            onChange={(e) => updateIndex(index, { unique: e.target.checked })}
                          />
                          unique
                        </label>

                        <button
                          onClick={() => removeIndex(index)}
                          className="col-span-6 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/45 transition hover:text-red-400 md:col-span-2"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeUp(5)} className="mt-6 rounded-md border border-dashed border-white/10 bg-white/2 p-4">
            <div className="flex items-center gap-2 text-orange-400">
              <Sparkles size={14} />
              <p className="text-[11px] uppercase tracking-[0.2em]">Backend Contract</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Frontend data shape matches backend contract: entities, relationships, and indexes,
              with field types restricted to uuid, string, text, integer, boolean, datetime,
              float, and json.
            </p>
            <p className="mt-2 text-[11px] text-white/30">
              Entity options loaded: {fieldOptionsByEntity.length}
            </p>
          </motion.div>
        </motion.div>
      </div>

      <AIRightSidebar
        onApplySuggestion={handleApplySuggestion}
        projectDescription="Refine and validate the project database schema design."
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
      />
    </div>
  );
}
