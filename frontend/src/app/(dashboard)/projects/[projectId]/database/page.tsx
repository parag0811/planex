"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import AIRightSidebar from "@/src/components/layout/project-section/AIRightSidebar";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateDatabase,
  getJobStatusThunk,
} from "@/src/store/slices/jobSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

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
  name: "field_name",
  type: "string",
  required: false,
  unique: false,
  description: "",
});

const createEmptyEntity = (): DatabaseEntity => ({
  name: "",
  description: "",
  fields: [],
});

const FIELD_PRESETS: Array<{
  label: string;
  field: DatabaseField;
}> = [
  {
    label: "Primary ID",
    field: { name: "id", type: "uuid", required: true, unique: true, description: "Primary key" },
  },
  {
    label: "Created At",
    field: {
      name: "createdAt",
      type: "datetime",
      required: true,
      unique: false,
      description: "Created timestamp",
    },
  },
  {
    label: "Updated At",
    field: {
      name: "updatedAt",
      type: "datetime",
      required: true,
      unique: false,
      description: "Updated timestamp",
    },
  },
  {
    label: "Name",
    field: { name: "name", type: "string", required: true, unique: false, description: "Display name" },
  },
  {
    label: "Email",
    field: { name: "email", type: "string", required: true, unique: true, description: "Unique email" },
  },
  {
    label: "Foreign Key",
    field: {
      name: "userId",
      type: "uuid",
      required: true,
      unique: false,
      description: "Reference to another entity",
    },
  },
];

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
  const params = useParams();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const resolvedProjectId = projectId && projectId !== "undefined" ? projectId : "";
  const dispatch = useDispatch<AppDispatch>();
  const jobState = useSelector((state: RootState) => state.job);
  const databaseSectionState = useSelector(
    (state: RootState) => state.section.projects[resolvedProjectId]?.database,
  );

  const [schema, setSchema] = useState<DatabaseSectionContent>({
    entities: [],
    relationships: [],
    indexes: [],
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [isSampleView, setIsSampleView] = useState(false);
  const [indexExpanded, setIndexExpanded] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftSnapshotRef = useRef<DatabaseSectionContent | null>(null);

  const entityNames = useMemo(
    () => schema.entities.map((entity) => entity.name.trim()).filter(Boolean),
    [schema.entities],
  );

  const isFetching = Boolean(databaseSectionState?.fetch.loading);
  const isSaving = Boolean(databaseSectionState?.save.loading);
  const isJobLoading =
    jobState.status === "pending" || jobState.status === "processing";
  const loading = isFetching || isSaving || isJobLoading;
  const error =
    databaseSectionState?.fetch.error ??
    databaseSectionState?.save.error ??
    (jobState.status === "failed" ? jobState.error : null);

  useEffect(() => {
    if (isSampleView) return;

    const normalized = normalizeSchema(databaseSectionState?.content);
    if (normalized) {
      setSchema(normalized);
      draftSnapshotRef.current = normalized;
    }
  }, [databaseSectionState?.content, isSampleView]);

  const fetchDatabaseSection = useCallback(async (force = false) => {
    if (!resolvedProjectId) {
      setSchema({ entities: [], relationships: [], indexes: [] });
      return;
    }

    const normalizedState = normalizeSchema(databaseSectionState?.content);
    if (!force && normalizedState) {
      setSchema(normalizedState);
      draftSnapshotRef.current = normalizedState;
      return;
    }

    try {
      const result = await dispatch(
        fetchSectionByType({ projectId: resolvedProjectId, type: "database" }),
      ).unwrap();

      const normalized = normalizeSchema(result.section?.content);
      if (normalized) {
        setSchema(normalized);
        draftSnapshotRef.current = normalized;
      }
    } catch {
      setSchema({ entities: [], relationships: [], indexes: [] });
    }
  }, [databaseSectionState?.content, dispatch, resolvedProjectId]);

  useEffect(() => {
    fetchDatabaseSection();
  }, [fetchDatabaseSection]);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 3500);
    return () => clearTimeout(timer);
  }, [status]);

  const handleGenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before generating database suggestions.");
      return;
    }

    try {
      dispatch(clearJobState());
      await dispatch(
        generateDatabase({ projectId: resolvedProjectId }),
      ).unwrap();

      setStatus("Database generation queued. We are processing it now.");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue database generation.");
    }
  };

  useEffect(() => {
    if (!jobState.jobId) {
      return;
    }

    if (jobState.status === "completed" || jobState.status === "failed") {
      return;
    }

    dispatch(getJobStatusThunk({ jobId: jobState.jobId }));

    const pollTimer = window.setInterval(() => {
      dispatch(getJobStatusThunk({ jobId: jobState.jobId! }));
    }, 2500);

    return () => {
      window.clearInterval(pollTimer);
    };
  }, [dispatch, jobState.jobId, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "completed") {
      return;
    }

    fetchDatabaseSection(true);
    setStatus("Database generation completed.");
    dispatch(clearJobState());
  }, [dispatch, fetchDatabaseSection, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "failed") {
      return;
    }

    setStatus(jobState.error ?? "Database generation failed.");
  }, [jobState.error, jobState.status]);

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

  const addField = (entityIndex: number, field: DatabaseField = createEmptyField()) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.map((entity, idx) =>
        idx === entityIndex ? { ...entity, fields: [...entity.fields, field] } : entity,
      ),
    }));
  };

  const addPresetField = (entityIndex: number, preset: DatabaseField) => {
    setSchema((current) => {
      const entity = current.entities[entityIndex];
      if (!entity) return current;

      const alreadyExists = entity.fields.some(
        (field) => field.name.trim().toLowerCase() === preset.name.trim().toLowerCase(),
      );

      if (alreadyExists) {
        setStatus(`Field \"${preset.name}\" already exists in ${entity.name}.`);
        return current;
      }

      return {
        ...current,
        entities: current.entities.map((item, idx) =>
          idx === entityIndex ? { ...item, fields: [...item.fields, preset] } : item,
        ),
      };
    });
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

  const handleSaveDraft = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before saving the database section.");
      return;
    }

    const hasEditableContent = schema.entities.length > 0;
    if (!hasEditableContent) {
      setStatus("All fields are empty. At least one entity must be added.");
      return;
    }

    try {
      const result = await dispatch(
        upsertSection({
          projectId: resolvedProjectId,
          type: "database",
          content: schema,
        }),
      ).unwrap();

      const normalized = normalizeSchema(result.section.content);
      if (normalized) {
        setSchema(normalized);
        draftSnapshotRef.current = normalized;
      }

      setStatus("Database section saved.");
    } catch (error: any) {
      setStatus(error?.message || "Failed to save database section.");
    }
  };

  const handleToggleSample = () => {
    if (isSampleView) {
      const restoredSchema =
        draftSnapshotRef.current ?? normalizeSchema(databaseSectionState?.content) ?? {
          entities: [],
          relationships: [],
          indexes: [],
        };

      setSchema(restoredSchema);
      setIsSampleView(false);
      setStatus("Restored your saved database draft.");
      return;
    }

    draftSnapshotRef.current = schema;
    setSchema(SAMPLE_SCHEMA);
    setIsSampleView(true);
    setStatus("Showing sample database. Click again to restore your saved draft.");
  };

  const schemaOverview = useMemo(
    () => ({
      entities: schema.entities.length,
      relationships: schema.relationships.length,
      indexes: schema.indexes?.length ?? 0,
    }),
    [schema.entities.length, schema.relationships.length, schema.indexes],
  );

  return (
    <div
      ref={scrollRef}
      className="flex w-full flex-1 overflow-y-auto overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto w-full px-4 py-5 sm:px-6 lg:px-8"
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
                onClick={handleGenerate}
                disabled={loading}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-blue-500/35 bg-blue-500/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200 transition hover:bg-blue-500/18 disabled:opacity-60"
              >
                <Sparkles size={12} />
                {isJobLoading ? "Generating..." : "Generate"}
              </button>
              <button
                onClick={handleToggleSample}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/20 hover:text-white/85"
              >
                <RefreshCw size={12} />
                {isSampleView ? "Show my database" : "Show sample"}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Save size={12} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(1)} className="mb-6 rounded-xl border border-white/8 bg-[#090e17] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300/90">
                  Manual Schema Builder
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>Design the database step by step</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
                  Start with singular entities, add their columns, connect entities with relationships,
                  and finish by adding indexes for frequently queried fields.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-white/55">
                <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                  <p className="text-lg font-bold text-white">{schemaOverview.entities}</p>
                  <p className="mt-1 uppercase tracking-[0.16em]">Entities</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                  <p className="text-lg font-bold text-white">{schemaOverview.relationships}</p>
                  <p className="mt-1 uppercase tracking-[0.16em]">Relations</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                  <p className="text-lg font-bold text-white">{schemaOverview.indexes}</p>
                  <p className="mt-1 uppercase tracking-[0.16em]">Indexes</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/8 bg-white/2 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">1. Entities</p>
                <p className="mt-2 text-sm text-white/60">
                  Use singular names like User, Project, or Task. Start with id and timestamps.
                </p>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/2 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">2. Relationships</p>
                <p className="mt-2 text-sm text-white/60">
                  Link entities using one-to-one, one-to-many, or many-to-many.
                </p>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/2 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">3. Indexes</p>
                <p className="mt-2 text-sm text-white/60">
                  Add indexes to frequently filtered fields like email and foreign keys.
                </p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mb-4 flex items-center gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400/90">
                  {isSaving
                    ? "Saving database section"
                    : isJobLoading
                      ? "Generating database section"
                      : "Loading database section"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-200/90"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mb-4 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-200/90"
              >
                {status}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp(1)} className="mb-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <Database size={20} className="text-orange-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold uppercase text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>DATABASE</h1>
                  <p className="mt-1 text-sm text-white/45">
                    Model entities, relationships, and indexes for your backend.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(2)} className="mb-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white/90" style={{ fontFamily: "'Roboto', sans-serif" }}>Entities</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={addEntity}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
                >
                  <Plus size={12} />
                  Add Entity
                </button>
                <p className="text-[11px] text-white/35">
                  Keep entity names singular and add only fields you need.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {schema.entities.map((entity, entityIndex) => (
                <div
                  key={entityIndex}
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
                      placeholder="What does this entity represent?"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      {FIELD_PRESETS.map((preset) => (
                        <button
                          key={`${preset.label}-${entityIndex}`}
                          onClick={() => addPresetField(entityIndex, preset.field)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-white/20 hover:text-white/95"
                        >
                          + {preset.label}
                        </button>
                      ))}
                      <button
                        onClick={() => addField(entityIndex)}
                        className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
                      >
                        + Blank Field
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] text-white/30">
                      Default columns already follow backend rules: id, createdAt, updatedAt.
                    </p>
                  </div>

                  <div className="p-3">
                    <div className="space-y-2">
                      {entity.fields.map((field, fieldIndex) => (
                        <div
                          key={fieldIndex}
                          className="rounded-md border border-white/6 bg-white/2 p-2.5"
                        >
                          <div className="grid grid-cols-12 gap-2">
                            <input
                              value={field.name}
                              onChange={(e) =>
                                updateField(entityIndex, fieldIndex, { name: e.target.value })
                              }
                              className="col-span-12 rounded-sm border border-white/8 bg-[#0b1019] px-2 py-1.5 text-xs text-white/80 outline-none md:col-span-3"
                              placeholder="column_name"
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
                              placeholder="Why does this field exist?"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp(3)} className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white/90" style={{ fontFamily: "'Roboto', sans-serif" }}>
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
                style={{ fontFamily: "'Roboto', sans-serif" }}
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
              The structure mirrors the database prompt builder in the backend.
            </p>
          </motion.div>
        </motion.div>
      </div>

      <AIRightSidebar isOpen={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
