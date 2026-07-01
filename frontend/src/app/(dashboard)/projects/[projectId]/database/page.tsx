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
  Pencil,
  Check,
  X,
  Download,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";
import {
  fetchSectionByType,
  upsertSection,
  clearAllSectionErrors,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateDatabase,
  getJobStatusThunk,
  regenerateSection,
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

const RELATION_TYPES: RelationType[] = [
  "one-to-one",
  "one-to-many",
  "many-to-many",
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: EASE },
  },
});

// ─── Design tokens ───────────────────────────────────────────────
const BG = "#141414";
const ACCENT = "#d84c28";
const BORDER = "#2b2321";
const MUTED = "#a6786d";
const INNER_BG = "#101010";

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};
const INTER_TIGHT: React.CSSProperties = {
  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
};

const TYPE_COLORS: Record<DatabaseFieldType, string> = {
  uuid: "#a6786d",
  string: "#fafafa",
  text: "#fafafa",
  integer: "#60a5fa",
  boolean: "#a78bfa",
  datetime: "#f59e0b",
  float: "#60a5fa",
  json: "#34d399",
};

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

const FIELD_PRESETS: Array<{ label: string; field: DatabaseField }> = [
  {
    label: "Primary ID",
    field: {
      name: "id",
      type: "uuid",
      required: true,
      unique: true,
      description: "Primary key",
    },
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
    field: {
      name: "name",
      type: "string",
      required: true,
      unique: false,
      description: "Display name",
    },
  },
  {
    label: "Email",
    field: {
      name: "email",
      type: "string",
      required: true,
      unique: true,
      description: "Unique email",
    },
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
        {
          name: "id",
          type: "uuid",
          required: true,
          unique: true,
          description: "Primary key",
        },
        {
          name: "email",
          type: "string",
          required: true,
          unique: true,
          description: "Login email",
        },
        {
          name: "name",
          type: "string",
          required: true,
          unique: false,
          description: "Display name",
        },
        {
          name: "createdAt",
          type: "datetime",
          required: true,
          unique: false,
          description: "Created timestamp",
        },
      ],
    },
    {
      name: "Invoice",
      description: "Billing record",
      fields: [
        {
          name: "id",
          type: "uuid",
          required: true,
          unique: true,
          description: "Primary key",
        },
        {
          name: "title",
          type: "string",
          required: true,
          unique: false,
          description: "Invoice title",
        },
        {
          name: "amount",
          type: "float",
          required: true,
          unique: false,
          description: "Total amount",
        },
        {
          name: "paid",
          type: "boolean",
          required: true,
          unique: false,
          description: "Payment status",
        },
        {
          name: "userId",
          type: "uuid",
          required: true,
          unique: false,
          description: "Owner reference",
        },
        {
          name: "createdAt",
          type: "datetime",
          required: true,
          unique: false,
          description: "Created timestamp",
        },
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
                      typeof fieldSource.description === "string"
                        ? fieldSource.description
                        : "",
                  };
                })
                .filter(Boolean) as DatabaseField[])
            : [];

          if (!source.name || typeof source.name !== "string") return null;

          return {
            name: source.name,
            description:
              typeof source.description === "string" ? source.description : "",
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
            description:
              typeof source.description === "string" ? source.description : "",
          };
        })
        .filter(Boolean) as DatabaseRelation[])
    : [];

  const indexes = Array.isArray(raw.indexes)
    ? (raw.indexes
        .map((index) => {
          if (!index || typeof index !== "object") return null;
          const source = index as Partial<DatabaseIndex>;
          if (
            typeof source.entity !== "string" ||
            !Array.isArray(source.fields)
          )
            return null;

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

  return { entities, relationships, indexes };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function DatabasePage() {
  const params = useParams();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId)
    ? rawProjectId[0]
    : rawProjectId;
  const resolvedProjectId =
    projectId && projectId !== "undefined" ? projectId : "";
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
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [previewData, setPreviewData] = useState<DatabaseSectionContent | null>(
    null,
  );
  const [isSampleView, setIsSampleView] = useState(false);
  const [indexExpanded, setIndexExpanded] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [editingEntityIndex, setEditingEntityIndex] = useState<number | null>(
    null,
  );
  const [entityNameDraft, setEntityNameDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftSnapshotRef = useRef<DatabaseSectionContent | null>(null);

  const entityNames = useMemo(
    () => schema.entities.map((entity) => entity.name.trim()).filter(Boolean),
    [schema.entities],
  );

  const canRegenerate =
    Boolean(previewData) ||
    hasGeneratedOnce ||
    schema.entities.length > 0 ||
    schema.relationships.length > 0 ||
    Boolean(schema.indexes?.length);

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

  const fetchDatabaseSection = useCallback(
    async (force = false) => {
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
          fetchSectionByType({
            projectId: resolvedProjectId,
            type: "database",
          }),
        ).unwrap();

        const normalized = normalizeSchema(result.section?.content);
        if (normalized) {
          setSchema(normalized);
          draftSnapshotRef.current = normalized;
        }
      } catch {
        setSchema({ entities: [], relationships: [], indexes: [] });
      }
    },
    [databaseSectionState?.content, dispatch, resolvedProjectId],
  );

  useEffect(() => {
    fetchDatabaseSection();
  }, [fetchDatabaseSection]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => { setStatus(null); setStatusType(null); }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleGenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before generating database suggestions.");
      setStatusType("error");
      return;
    }

    try {
      dispatch(clearJobState());
      await dispatch(
        generateDatabase({ projectId: resolvedProjectId }),
      ).unwrap();
      setStatus("Database generation queued. We are processing it now.");
      setStatusType("success");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to queue database generation."));
      setStatusType("error");
    }
  };

  const handleRegenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before regenerating the database section.");
      setStatusType("error");
      return;
    }

    setPreviewData(null);

    try {
      dispatch(clearJobState());
      await dispatch(
        regenerateSection({
          projectId: resolvedProjectId,
          section: "database",
        }),
      ).unwrap();
      setStatus("Database regeneration queued. We are processing it now.");
      setStatusType("success");
    } catch (error: unknown) {
      setStatus(
        getErrorMessage(error, "Failed to queue database regeneration."),
      );
      setStatusType("error");
    }
  };

  useEffect(() => {
    if (!jobState.jobId) return;
    if (jobState.status === "completed" || jobState.status === "failed") return;

    dispatch(getJobStatusThunk({ jobId: jobState.jobId }));

    const pollTimer = window.setInterval(() => {
      dispatch(getJobStatusThunk({ jobId: jobState.jobId! }));
    }, 2500);

    return () => window.clearInterval(pollTimer);
  }, [dispatch, jobState.jobId, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "completed") return;

    if (jobState.result) {
      const normalized = normalizeSchema(jobState.result);
      if (normalized) {
        setPreviewData(normalized);
        setHasGeneratedOnce(true);
        setStatus("Database generation completed. Review the preview below.");
        setStatusType("success");
      } else {
        setStatus("Database generation returned invalid schema.");
        setStatusType("error");
      }
    }

    dispatch(clearJobState());
  }, [dispatch, jobState.result, jobState.status]);

  useEffect(() => {
    if (jobState.status !== "failed") return;
    setStatus(jobState.error ?? "Database generation failed.");
    setStatusType("error");
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

  const startEditEntityName = (index: number) => {
    const currentName = schema.entities[index]?.name ?? "";
    setEditingEntityIndex(index);
    setEntityNameDraft(currentName);
  };

  const cancelEditEntityName = () => {
    setEditingEntityIndex(null);
    setEntityNameDraft("");
  };

  const saveEditEntityName = () => {
    if (editingEntityIndex === null) return;
    const nextName = entityNameDraft.trim();
    if (!nextName) {
      setStatus("Entity name is required.");
      return;
    }
    updateEntity(editingEntityIndex, { name: nextName });
    setEditingEntityIndex(null);
    setEntityNameDraft("");
  };

  const removeEntity = (index: number) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.filter(
        (_, entityIndex) => entityIndex !== index,
      ),
    }));
    setStatus("Entity removed.");
  };

  const addField = (
    entityIndex: number,
    field: DatabaseField = createEmptyField(),
  ) => {
    setSchema((current) => ({
      ...current,
      entities: current.entities.map((entity, idx) =>
        idx === entityIndex
          ? { ...entity, fields: [...entity.fields, field] }
          : entity,
      ),
    }));
  };

  const addPresetField = (entityIndex: number, preset: DatabaseField) => {
    setSchema((current) => {
      const entity = current.entities[entityIndex];
      if (!entity) return current;

      const alreadyExists = entity.fields.some(
        (field) =>
          field.name.trim().toLowerCase() === preset.name.trim().toLowerCase(),
      );

      if (alreadyExists) {
        setStatus(`Field "${preset.name}" already exists in ${entity.name}.`);
        return current;
      }

      return {
        ...current,
        entities: current.entities.map((item, idx) =>
          idx === entityIndex
            ? { ...item, fields: [...item.fields, preset] }
            : item,
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
          fields: entity.fields.filter(
            (_, idxField) => idxField !== fieldIndex,
          ),
        };
      }),
    }));
  };

  const handleAcceptPreview = () => {
    if (!previewData) return;
    setSchema(previewData);
    setPreviewData(null);
    setStatus("Preview applied to form. Click Save to persist.");
  };

  const handleRejectPreview = () => {
    setPreviewData(null);
    setStatus(null);
  };

  const handleAISuggestion = (suggestion: ApplySuggestion) => {
    if (suggestion.section !== "database" || !suggestion.payload) {
      setStatus("Invalid suggestion received.");
      return;
    }

    try {
      const merged: DatabaseSectionContent = {
        entities:
          (suggestion.payload.entities as DatabaseEntity[] | undefined) ??
          schema.entities,
        relationships:
          (suggestion.payload.relationships as
            | DatabaseRelation[]
            | undefined) ?? schema.relationships,
        indexes:
          (suggestion.payload.indexes as DatabaseIndex[] | undefined) ??
          schema.indexes,
      };

      setSchema(merged);
      setStatus("AI suggestion applied. Click Save to persist changes.");
    } catch (error) {
      setStatus(
        "Failed to apply AI suggestion. Please review the changes manually.",
      );
      console.error("Error applying suggestion:", error);
    }
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

  const updateRelationship = (
    index: number,
    patch: Partial<DatabaseRelation>,
  ) => {
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
        { entity: entityNames[0] || "", fields: [], unique: false },
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
      setStatusType("success");
    } catch (error: unknown) {
      setStatus(getErrorMessage(error, "Failed to save database section."));
      setStatusType("error");
    }
  };

  const handleToggleSample = () => {
    if (isSampleView) {
      const restoredSchema = draftSnapshotRef.current ??
        normalizeSchema(databaseSectionState?.content) ?? {
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
    setStatus(
      "Showing sample database. Click again to restore your saved draft.",
    );
  };

  const schemaOverview = useMemo(
    () => ({
      entities: schema.entities.length,
      relationships: schema.relationships.length,
      indexes: schema.indexes?.length ?? 0,
    }),
    [schema.entities.length, schema.relationships.length, schema.indexes],
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "database-schema.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={scrollRef}
      className="flex w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
      style={{ ...INTER, backgroundColor: BG }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto no-scrollbar">
        <motion.div
          className={`mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-8 lg:pl-10 transition-[padding-right] duration-300 ${aiOpen ? "lg:pr-85" : "lg:pr-10"}`}
          initial="hidden"
          animate="show"
        >
          {/* Top bar */}
          <motion.div
            variants={fadeUp(0)}
            className="mb-8 flex flex-wrap items-center justify-end gap-2"
          >
            <button
              onClick={() => fetchDatabaseSection(true)}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            {!canRegenerate ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Sparkles size={12} />
                {isJobLoading ? "Generating..." : "Generate"}
              </button>
            ) : (
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
                style={{
                  ...MONO,
                  borderColor: "#60a5fa55",
                  color: "#60a5fa",
                  backgroundColor: "#60a5fa12",
                }}
              >
                <Sparkles size={12} />
                {isJobLoading ? "Regenerating..." : "Regenerate"}
              </button>
            )}
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
              style={{
                ...MONO,
                borderColor: ACCENT,
                color: ACCENT,
                backgroundColor: `${ACCENT}12`,
              }}
            >
              <Save size={12} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </motion.div>

          {/* ── Loading bar (matches Idea page) ── */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 flex items-center gap-2.5 border px-4 py-2.5"
                style={{
                  borderColor: `${ACCENT}30`,
                  backgroundColor: `${ACCENT}10`,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-4 w-4 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: ACCENT, borderTopColor: "transparent" }}
                />
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ ...MONO, color: ACCENT }}
                >
                  {isJobLoading ? "Generating database section" : isSaving ? "Saving database section" : "Loading database section"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error (matches Idea page) ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                className="mb-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-md" />
                <div 
                  className="relative border p-4 flex items-start gap-4"
                  style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}
                >
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 mb-1"
                      style={MONO}
                    >
                      Error Detected
                    </p>
                    <p className="text-sm text-red-200/90 leading-relaxed" style={INTER}>
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(clearAllSectionErrors());
                      dispatch(clearJobState());
                    }}
                    className="shrink-0 p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-500/30"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Status (matches Idea page) ── */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.25 }}
                className="mb-6 flex items-center gap-3 border px-4 py-3"
                style={{
                  borderColor: statusType === "success" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)",
                  backgroundColor: statusType === "success" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                }}
              >
                {statusType === "success"
                  ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  : <Zap size={16} className="text-amber-500 shrink-0" />}
                <p className="text-sm font-medium" style={{ ...INTER, color: statusType === "success" ? "#34d399" : "#fbbf24" }}>
                  {status}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Breadcrumb (matches Idea page exactly) ── */}
          <motion.div variants={fadeUp(1)} className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ ...MONO, color: ACCENT }}>
              Section // 02 / Database Design
            </p>
          </motion.div>

          {/* ── Giant headline (matches Idea page) ── */}
          <motion.div variants={fadeUp(2)} className="mb-8">
            <h1
              className="text-[3.4rem] sm:text-[4.2rem] md:text-[5rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
              style={INTER_TIGHT}
            >
              Database
            </h1>
            <p className="mt-4 text-sm max-w-2xl" style={{ ...INTER, color: MUTED }}>
              Model entities, relationships, and indexes for your backend.
            </p>
          </motion.div>

          {/* Add entity row */}
          <motion.div
            variants={fadeUp(4)}
            className="mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <h2 className="text-xl font-bold text-white" style={INTER_TIGHT}>
              Entities
            </h2>
            <button
              onClick={addEntity}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
              style={{
                ...MONO,
                borderColor: ACCENT,
                color: ACCENT,
                backgroundColor: `${ACCENT}12`,
              }}
            >
              <Plus size={12} />
              Add Entity
            </button>
          </motion.div>

          {/* Entity blocks — each rendered like the USERS screenshot */}
          <div className="flex flex-col gap-16 mb-16">
            {schema.entities.map((entity, entityIndex) => {
              const entityRelationships = schema.relationships.filter(
                (r) => r.from === entity.name || r.to === entity.name,
              );
              const entityIndexes = (schema.indexes ?? []).filter(
                (i) => i.entity === entity.name,
              );

              return (
                <motion.div key={entityIndex} variants={fadeUp(entityIndex)}>
                  {/* Entity headline block */}
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingEntityIndex === entityIndex ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            value={entityNameDraft}
                            onChange={(e) => setEntityNameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditEntityName();
                              if (e.key === "Escape") cancelEditEntityName();
                            }}
                            autoFocus
                            className="text-[2.4rem] sm:text-[3rem] font-black uppercase leading-none tracking-[-0.03em] text-white bg-transparent border-b outline-none w-full"
                            style={{ ...INTER_TIGHT, borderColor: ACCENT }}
                            placeholder="ENTITY_NAME"
                          />
                          <button
                            onClick={saveEditEntityName}
                            className="shrink-0 p-2 border"
                            style={{
                              borderColor: "#22c55e55",
                              color: "#22c55e",
                            }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditEntityName}
                            className="shrink-0 p-2 border"
                            style={{ borderColor: BORDER, color: MUTED }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 mb-2 group">
                          <h2
                            className="text-[2.4rem] sm:text-[3rem] font-black uppercase leading-none tracking-[-0.03em] text-white"
                            style={INTER_TIGHT}
                          >
                            {entity.name || "Untitled"}
                          </h2>
                          <button
                            onClick={() => startEditEntityName(entityIndex)}
                            className="mt-3 opacity-0 group-hover:opacity-100 transition shrink-0"
                            style={{ color: MUTED }}
                            aria-label="Edit entity name"
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      )}

                      <input
                        value={entity.description}
                        onChange={(e) =>
                          updateEntity(entityIndex, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe what this entity represents..."
                        className="bg-transparent text-[11px] uppercase tracking-[0.14em] outline-none w-full text-white placeholder:opacity-50"
                        style={{ ...MONO, color: MUTED }}
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                      >
                        Entity_{String(entityIndex + 1).padStart(3, "0")}
                      </span>
                      <button
                        onClick={() => removeEntity(entityIndex)}
                        className="p-2 border transition hover:text-red-400"
                        style={{ borderColor: BORDER, color: MUTED }}
                        aria-label="Remove entity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Field presets */}
                  <div className="mb-5 flex flex-wrap gap-2">
                    {FIELD_PRESETS.map((preset) => (
                      <button
                        key={`${preset.label}-${entityIndex}`}
                        onClick={() =>
                          addPresetField(entityIndex, preset.field)
                        }
                        className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition"
                        style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                      >
                        + {preset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => addField(entityIndex)}
                      className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition"
                      style={{
                        ...MONO,
                        borderColor: ACCENT,
                        color: ACCENT,
                        backgroundColor: `${ACCENT}12`,
                      }}
                    >
                      + Blank Field
                    </button>
                  </div>

                  {/* Schema fields table */}
                  <div className="mb-3 flex items-center justify-between">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Schema Fields
                    </p>
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ ...MONO, color: ACCENT }}
                    >
                      <Download size={11} />
                      Export JSON
                    </button>
                  </div>

                  <div className="border" style={{ borderColor: BORDER }}>
                    {/* Table header */}
                    <div
                      className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b"
                      style={{ borderColor: BORDER }}
                    >
                      {["Field Name", "Datatype", "Required", "Unique", ""].map(
                        (h) => (
                          <p
                            key={h}
                            className="text-[9px] font-bold uppercase tracking-[0.16em]"
                            style={{ ...MONO, color: MUTED }}
                          >
                            {h}
                          </p>
                        ),
                      )}
                    </div>

                    {entity.fields.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p
                          className="text-sm"
                          style={{ ...INTER, color: MUTED }}
                        >
                          No fields yet. Add one above.
                        </p>
                      </div>
                    )}

                    {entity.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-3 px-4 py-3.5 border-b last:border-b-0 items-center"
                        style={{ borderColor: BORDER }}
                      >
                        <input
                          value={field.name}
                          onChange={(e) =>
                            updateField(entityIndex, fieldIndex, {
                              name: e.target.value,
                            })
                          }
                          className="bg-transparent text-sm font-semibold text-white outline-none"
                          style={INTER}
                          placeholder="field_name"
                        />

                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(entityIndex, fieldIndex, {
                              type: e.target.value as DatabaseFieldType,
                            })
                          }
                          className="border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] outline-none w-fit"
                          style={{
                            ...MONO,
                            borderColor: BORDER,
                            color: TYPE_COLORS[field.type],
                            backgroundColor: INNER_BG,
                          }}
                        >
                          {FIELD_TYPES.map((type) => (
                            <option
                              key={type}
                              value={type}
                              style={{
                                backgroundColor: INNER_BG,
                                color: "#fff",
                              }}
                            >
                              {type}
                            </option>
                          ))}
                        </select>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(entityIndex, fieldIndex, {
                                required: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <span
                            className="h-2.5 w-2.5 rounded-full transition-colors"
                            style={{
                              backgroundColor: field.required ? ACCENT : BORDER,
                            }}
                          />
                          <span
                            className="text-[10px] uppercase tracking-[0.1em]"
                            style={{ ...MONO, color: MUTED }}
                          >
                            req
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(field.unique)}
                            onChange={(e) =>
                              updateField(entityIndex, fieldIndex, {
                                unique: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <Check
                            size={14}
                            style={{
                              color: field.unique ? "#22c55e" : "#3a3a3a",
                            }}
                          />
                        </label>

                        <button
                          onClick={() => removeField(entityIndex, fieldIndex)}
                          className="justify-self-end p-1.5 transition hover:text-red-400"
                          style={{ color: MUTED }}
                          aria-label="Remove field"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addField(entityIndex)}
                      className="w-full border-t py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:text-white"
                      style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                    >
                      + Add Field to {entity.name || "Entity"}
                    </button>
                  </div>

                  {/* Relationships + Indexes for this entity */}
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Relationships panel */}
                    <div
                      className="border p-5"
                      style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                    >
                      <p
                        className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ ...MONO, color: MUTED }}
                      >
                        Relationships
                      </p>
                      {entityRelationships.length === 0 ? (
                        <p
                          className="text-sm"
                          style={{ ...INTER, color: MUTED }}
                        >
                          No relationships yet.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {entityRelationships.map((relation, i) => {
                            const otherEntity =
                              relation.from === entity.name
                                ? relation.to
                                : relation.from;
                            const relLabel =
                              relation.type === "one-to-many"
                                ? "Has Many"
                                : relation.type === "one-to-one"
                                  ? "Has One"
                                  : "Many To Many";
                            const globalIndex =
                              schema.relationships.indexOf(relation);
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-2"
                              >
                                <div>
                                  <p
                                    className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1"
                                    style={{ ...MONO, color: MUTED }}
                                  >
                                    {relLabel}
                                  </p>
                                  <p
                                    className="text-sm font-bold uppercase tracking-[0.02em]"
                                    style={{ ...INTER_TIGHT, color: ACCENT }}
                                  >
                                    {otherEntity || "—"}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    removeRelationship(globalIndex)
                                  }
                                  style={{ color: MUTED }}
                                  className="hover:text-red-400 transition"
                                >
                                  <Link2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Indexes panel */}
                    <div
                      className="border p-5"
                      style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                    >
                      <p
                        className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ ...MONO, color: MUTED }}
                      >
                        Indexes
                      </p>
                      {entityIndexes.length === 0 ? (
                        <p
                          className="text-sm"
                          style={{ ...INTER, color: MUTED }}
                        >
                          No indexes yet.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {entityIndexes.map((idx, i) => {
                            const globalIndex = (schema.indexes ?? []).indexOf(
                              idx,
                            );
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span
                                  className="flex h-6 w-7 shrink-0 items-center justify-center text-[9px] font-bold uppercase"
                                  style={{
                                    ...MONO,
                                    border: `1px solid ${BORDER}`,
                                    color: idx.unique ? "#22c55e" : MUTED,
                                  }}
                                >
                                  {idx.unique ? "UX" : "IX"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-[11px] font-bold uppercase tracking-[0.08em] text-white truncate"
                                    style={MONO}
                                  >
                                    {idx.unique
                                      ? `UNIQUE_${(idx.fields[0] || "").toUpperCase()}`
                                      : `IDX_${(idx.fields[0] || "").toUpperCase()}`}
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ ...MONO, color: MUTED }}
                                  >
                                    ({idx.fields.join(", ") || "—"})
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeIndex(globalIndex)}
                                  style={{ color: MUTED }}
                                  className="hover:text-red-400 transition shrink-0"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Global relationship builder */}
          <motion.div variants={fadeUp(5)} className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="flex items-center gap-2 text-xl font-bold text-white"
                style={INTER_TIGHT}
              >
                <Link2 size={16} style={{ color: ACCENT }} />
                Manage Relationships
              </h2>
              <button
                onClick={addRelationship}
                disabled={entityNames.length === 0}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Plus size={12} />
                Add Relationship
              </button>
            </div>

            <div
              className="border p-3 flex flex-col gap-2"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              {schema.relationships.length === 0 && (
                <p
                  className="px-2 py-2 text-sm"
                  style={{ ...INTER, color: MUTED }}
                >
                  No relationships yet.
                </p>
              )}

              {schema.relationships.map((relation, index) => (
                <div
                  key={`${relation.from}-${relation.to}-${index}`}
                  className="border p-3"
                  style={{ borderColor: BORDER }}
                >
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                    <select
                      value={relation.from}
                      onChange={(e) =>
                        updateRelationship(index, { from: e.target.value })
                      }
                      className="md:col-span-3 border px-2 py-1.5 text-xs outline-none"
                      style={{
                        borderColor: BORDER,
                        color: "#fff",
                        backgroundColor: BG,
                        ...INTER,
                      }}
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
                        updateRelationship(index, {
                          type: e.target.value as RelationType,
                        })
                      }
                      className="md:col-span-3 border px-2 py-1.5 text-xs outline-none"
                      style={{
                        borderColor: BORDER,
                        color: "#60a5fa",
                        backgroundColor: BG,
                        ...MONO,
                      }}
                    >
                      {RELATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    <select
                      value={relation.to}
                      onChange={(e) =>
                        updateRelationship(index, { to: e.target.value })
                      }
                      className="md:col-span-3 border px-2 py-1.5 text-xs outline-none"
                      style={{
                        borderColor: BORDER,
                        color: "#fff",
                        backgroundColor: BG,
                        ...INTER,
                      }}
                    >
                      {entityNames.map((name) => (
                        <option key={`to-${name}`} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeRelationship(index)}
                      className="md:col-span-3 border px-2 py-1.5 text-xs transition hover:text-red-400"
                      style={{ borderColor: BORDER, color: MUTED, ...MONO }}
                    >
                      Remove
                    </button>

                    <input
                      value={relation.description ?? ""}
                      onChange={(e) =>
                        updateRelationship(index, {
                          description: e.target.value,
                        })
                      }
                      className="md:col-span-12 border px-2 py-1.5 text-xs outline-none text-white"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: BG,
                        ...INTER,
                      }}
                      placeholder="Relationship description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Global index builder */}
          <motion.div variants={fadeUp(6)} className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setIndexExpanded((current) => !current)}
                className="flex cursor-pointer items-center gap-2 text-xl font-bold text-white"
                style={INTER_TIGHT}
              >
                {indexExpanded ? (
                  <ChevronDown size={16} style={{ color: ACCENT }} />
                ) : (
                  <ChevronRight size={16} style={{ color: ACCENT }} />
                )}
                <Rows3 size={16} style={{ color: ACCENT }} />
                Manage Indexes
              </button>
              <button
                onClick={addIndex}
                disabled={entityNames.length === 0}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Plus size={12} />
                Add Index
              </button>
            </div>

            {indexExpanded && (
              <div
                className="border p-3 flex flex-col gap-2"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                {(schema.indexes ?? []).length === 0 && (
                  <p
                    className="px-2 py-2 text-sm"
                    style={{ ...INTER, color: MUTED }}
                  >
                    No indexes yet.
                  </p>
                )}

                {(schema.indexes ?? []).map((item, index) => {
                  const selectedEntity = schema.entities.find(
                    (entity) => entity.name === item.entity,
                  );

                  return (
                    <div
                      key={`${item.entity}-${index}`}
                      className="border p-3"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                        <select
                          value={item.entity}
                          onChange={(e) =>
                            updateIndex(index, {
                              entity: e.target.value,
                              fields: [],
                            })
                          }
                          className="md:col-span-4 border px-2 py-1.5 text-xs outline-none"
                          style={{
                            borderColor: BORDER,
                            color: "#fff",
                            backgroundColor: BG,
                            ...INTER,
                          }}
                        >
                          {entityNames.map((name) => (
                            <option key={`index-entity-${name}`} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.fields[0] ?? ""}
                          onChange={(e) =>
                            updateIndex(index, {
                              fields: e.target.value ? [e.target.value] : [],
                            })
                          }
                          className="md:col-span-4 border px-2 py-1.5 text-xs outline-none"
                          style={{
                            borderColor: BORDER,
                            color: "#fff",
                            backgroundColor: BG,
                            ...INTER,
                          }}
                        >
                          <option value="">Select field</option>
                          {(selectedEntity?.fields ?? []).map((field) => (
                            <option
                              key={`index-field-${field.name}`}
                              value={field.name}
                            >
                              {field.name}
                            </option>
                          ))}
                        </select>

                        <label
                          className="md:col-span-2 flex items-center gap-2 border px-2 py-1.5 text-[11px]"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(item.unique)}
                            onChange={(e) =>
                              updateIndex(index, { unique: e.target.checked })
                            }
                          />
                          unique
                        </label>

                        <button
                          onClick={() => removeIndex(index)}
                          className="md:col-span-2 border px-2 py-1.5 text-xs transition hover:text-red-400"
                          style={{ borderColor: BORDER, color: MUTED, ...MONO }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Backend contract note */}
          <motion.div
            variants={fadeUp(7)}
            className="border border-dashed p-5"
            style={{ borderColor: BORDER }}
          >
            <div
              className="flex items-center gap-2 mb-2"
              style={{ color: ACCENT }}
            >
              <Sparkles size={13} />
              <p
                className="text-[10px] uppercase tracking-[0.2em]"
                style={MONO}
              >
                Backend Contract
              </p>
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ ...INTER, color: MUTED }}
            >
              Frontend data shape matches backend contract: entities,
              relationships, and indexes, with field types restricted to uuid,
              string, text, integer, boolean, datetime, float, and json.
            </p>
          </motion.div>

          {/* ── Manual Schema Builder Overview ── */}
          <motion.div
            variants={fadeUp(8)}
            className="mt-10 border p-6"
            style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
          >
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={INTER_TIGHT}
            >
              Manual Schema Builder
            </h2>
            <p
              className="text-sm leading-relaxed max-w-2xl mb-6"
              style={{ ...INTER, color: MUTED }}
            >
              Start with singular entities, add their columns, connect entities
              with relationships, and finish by adding indexes for frequently
              queried fields.
            </p>

            <div
              className="grid grid-cols-1 gap-px sm:grid-cols-3"
              style={{ backgroundColor: BORDER }}
            >
              {[
                { label: "Entities", value: schemaOverview.entities },
                { label: "Relations", value: schemaOverview.relationships },
                { label: "Indexes", value: schemaOverview.indexes },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4"
                  style={{ backgroundColor: INNER_BG }}
                >
                  <p
                    className="text-2xl font-black text-white"
                    style={INTER_TIGHT}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ ...MONO, color: MUTED }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AIRightSidebar
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
        onApplySuggestion={handleAISuggestion}
      />

      {/* Preview modal */}
      <AnimatePresence>
        {previewData && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleRejectPreview}
              className="fixed inset-0 z-40 bg-black/60"
              aria-label="Close preview modal"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-6 no-scrollbar"
              style={{ borderColor: BORDER, backgroundColor: BG, ...INTER }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p
                  className="text-lg font-bold uppercase tracking-[0.06em] text-white"
                  style={INTER_TIGHT}
                >
                  Preview Generated Database Schema
                </p>
                <button
                  onClick={handleRejectPreview}
                  className="p-1 transition hover:text-white"
                  style={{ color: MUTED }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-6">
                {(previewData.entities || []).length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Entities
                    </p>
                    <div className="space-y-2">
                      {previewData.entities.map((entity, idx) => (
                        <div
                          key={idx}
                          className="border p-3"
                          style={{
                            borderColor: BORDER,
                            backgroundColor: INNER_BG,
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="font-semibold text-white"
                              style={INTER}
                            >
                              {entity.name}
                            </p>
                            <p className="text-xs" style={{ color: MUTED }}>
                              {entity.description}
                            </p>
                          </div>
                          <div
                            className="text-xs space-y-1"
                            style={{ color: MUTED }}
                          >
                            {entity.fields.map((f, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <div className="text-white">
                                  {f.name}{" "}
                                  <span style={{ color: MUTED }}>
                                    · {f.type}
                                    {f.required ? " · required" : ""}
                                  </span>
                                </div>
                                <div>{f.unique ? "unique" : ""}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(previewData.relationships || []).length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Relationships
                    </p>
                    <div className="space-y-2">
                      {previewData.relationships.map((r, i) => (
                        <div
                          key={i}
                          className="border p-3"
                          style={{
                            borderColor: BORDER,
                            backgroundColor: INNER_BG,
                          }}
                        >
                          <p className="text-sm text-white" style={INTER}>
                            {r.from} → {r.to} ({r.type})
                          </p>
                          {r.description && (
                            <p className="text-xs" style={{ color: MUTED }}>
                              {r.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(previewData.indexes ?? []).length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Indexes
                    </p>
                    <div className="space-y-2">
                      {(previewData.indexes ?? []).map((idx, i) => (
                        <div
                          key={i}
                          className="border p-3 text-sm text-white"
                          style={{
                            borderColor: BORDER,
                            backgroundColor: INNER_BG,
                            ...INTER,
                          }}
                        >
                          {idx.entity} · {idx.fields.join(", ")}
                          {idx.unique ? " · unique" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="mt-6 flex justify-end gap-3 border-t pt-6"
                style={{ borderColor: BORDER }}
              >
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50"
                  style={{
                    ...MONO,
                    borderColor: "#60a5fa55",
                    color: "#60a5fa",
                    backgroundColor: "#60a5fa12",
                  }}
                >
                  Regenerate
                </button>
                <button
                  onClick={handleRejectPreview}
                  className="border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                  style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                >
                  Reject
                </button>
                <button
                  onClick={handleAcceptPreview}
                  className="border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                  style={{
                    ...MONO,
                    borderColor: "#22c55e55",
                    color: "#22c55e",
                    backgroundColor: "#22c55e12",
                  }}
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
