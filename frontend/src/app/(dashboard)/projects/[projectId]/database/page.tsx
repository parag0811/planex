"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Skeleton,
} from "@/src/components/ui";
import { StickyApprovalBar } from "@/src/components/workspace/sticky-approval-bar";
import { useJobPolling } from "@/src/hooks/useJobPolling";
import {
  buildSql,
  EMPTY_DATABASE,
  normalizeDatabase,
  type DatabaseContent,
  type DatabaseField,
} from "@/src/lib/database-content";
import { generateDatabase } from "@/src/store/slices/jobSlice";
import { fetchProjectById } from "@/src/store/slices/projectSlice";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const FIELD_TYPES = [
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

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

const fieldKey = (field: DatabaseField) => {
  if (field.name === "id") return "PK";
  if (field.unique) return "UQ";
  if (field.name.endsWith("_id")) return "FK";
  return "";
};

export default function DatabasePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const sectionRecord = useSelector(
    (state: RootState) => state.section.projects[projectId]?.database,
  );
  const job = useSelector((state: RootState) => state.job.jobs.database);
  const project = useSelector((state: RootState) => state.project.currentProject);

  const [content, setContent] = useState<DatabaseContent>(EMPTY_DATABASE);
  const [savedContent, setSavedContent] =
    useState<DatabaseContent>(EMPTY_DATABASE);
  const [preview, setPreview] = useState<DatabaseContent | null>(null);
  const [hasSection, setHasSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [view, setView] = useState<"entities" | "sql">("entities");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useJobPolling({
    jobId,
    status: job?.status ?? "idle",
    section: "database",
    timeoutMessage: "Database generation is taking longer than expected.",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(
          fetchSectionByType({ projectId, type: "database" }),
        ).unwrap();

        if (result.section?.content && !cancelled) {
          const normalized = normalizeDatabase(result.section.content);
          setContent(normalized);
          setSavedContent(normalized);
          setHasSection(true);
        }
      } catch {
        // 404 means the database has not been generated yet.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, projectId]);

  useEffect(() => {
    if (job?.status === "completed" && job.result) {
      const payload =
        (job.result as { database?: unknown })?.database ?? job.result;
      setPreview(normalizeDatabase(payload));
      setError(null);
      setGenerating(false);
    }

    if (job?.status === "failed" || job?.status === "timed_out") {
      setError(
        job.error ||
          (job.status === "timed_out"
            ? "Database generation is taking longer than expected."
            : "Database generation failed. Please retry."),
      );
      setGenerating(false);
    }
  }, [job?.status, job?.result, job?.error]);

  const displayed = preview ?? content;
  const dirty = preview !== null || isEditing;
  const jobActive =
    job?.status === "pending" ||
    job?.status === "processing" ||
    (Boolean(jobId) && !preview && !error);
  const version = sectionRecord?.data?.version ?? 1;
  const projectName = project?.name || "this project";

  const statusLabel = dirty
    ? "Draft not saved"
    : hasSection
      ? "Approved · Saved"
      : "Draft not saved";
  const nextLabel =
    hasSection && !preview ? "Next stage: API" : "Next after approval: API";
  const stageBadge = preview
    ? { label: "AI draft", tone: "warning" as const }
    : hasSection
      ? { label: "Approved · Saved", tone: "brand" as const }
      : { label: "Empty", tone: "neutral" as const };

  const queueGeneration = async (forceRegenerate: boolean) => {
    setGenerating(true);
    setError(null);

    try {
      const queued = await dispatch(
        generateDatabase({ projectId, forceRegenerate }),
      ).unwrap();

      if (queued.jobId) {
        setJobId(queued.jobId);
      } else if (queued.cachedData) {
        setPreview(normalizeDatabase(queued.cachedData));
        setGenerating(false);
      } else {
        setGenerating(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate the database."));
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!dirty) return;

    setSaving(true);
    setError(null);

    try {
      const payload = preview ?? content;
      await dispatch(
        upsertSection({ projectId, type: "database", content: payload }),
      ).unwrap();

      setContent(payload);
      setSavedContent(payload);
      setPreview(null);
      setIsEditing(false);
      setHasSection(true);
      dispatch(fetchProjectById(projectId));
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the database."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (preview) {
      setContent(preview);
      setPreview(null);
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setContent(savedContent);
    setPreview(null);
    setIsEditing(false);
    setError(null);
  };

  const updateEntity = (
    entityIndex: number,
    field: "name" | "description",
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      entities: prev.entities.map((entity, index) =>
        index === entityIndex ? { ...entity, [field]: value } : entity,
      ),
    }));
  };

  const updateField = (
    entityIndex: number,
    fieldIndex: number,
    patch: Partial<DatabaseField>,
  ) => {
    setContent((prev) => ({
      ...prev,
      entities: prev.entities.map((entity, index) =>
        index === entityIndex
          ? {
              ...entity,
              fields: entity.fields.map((field, itemIndex) =>
                itemIndex === fieldIndex ? { ...field, ...patch } : field,
              ),
            }
          : entity,
      ),
    }));
  };

  const addField = (entityIndex: number) => {
    setContent((prev) => ({
      ...prev,
      entities: prev.entities.map((entity, index) =>
        index === entityIndex
          ? {
              ...entity,
              fields: [
                ...entity.fields,
                {
                  name: "new_field",
                  type: "varchar",
                  required: true,
                  unique: false,
                },
              ],
            }
          : entity,
      ),
    }));
  };

  const removeField = (entityIndex: number, fieldIndex: number) => {
    setContent((prev) => ({
      ...prev,
      entities: prev.entities.map((entity, index) =>
        index === entityIndex
          ? {
              ...entity,
              fields: entity.fields.filter(
                (_, itemIndex) => itemIndex !== fieldIndex,
              ),
            }
          : entity,
      ),
    }));
  };

  const addEntity = () => {
    setContent((prev) => ({
      ...prev,
      entities: [
        ...prev.entities,
        {
          name: "new_entity",
          description: "",
          fields: [
            { name: "id", type: "uuid", required: true, unique: true },
          ],
        },
      ],
    }));
  };

  const removeEntity = (entityIndex: number) => {
    setContent((prev) => ({
      ...prev,
      entities: prev.entities.filter((_, index) => index !== entityIndex),
    }));
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(buildSql(displayed));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the SQL to the clipboard.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasAnyContent =
    hasSection ||
    preview !== null ||
    displayed.entities.length > 0;

  if (!hasAnyContent && !jobActive) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-8">
        <Card className="w-full max-w-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-lg font-semibold text-ink">
                No database yet
              </h1>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Approve the Requirements stage first, then Planex can draft a
              relational schema for {projectName}.
            </p>

            {error ? (
              <p className="mt-3 text-[11px] text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => void queueGeneration(false)}
                loading={generating}
              >
                Generate database
              </Button>
              <Link
                href={`/projects/${projectId}/idea`}
                className="text-[12px] text-brand hover:underline"
              >
                Review Requirements
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-[1200px] space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-ink-muted">
                BLUEPRINT / 02 OF 04
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={stageBadge.tone}>{stageBadge.label}</Badge>
                <span className="text-[11px] text-ink-muted">
                  Version {version}
                </span>
              </div>
            </div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Database
            </h1>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              A relational foundation for feedback, votes and workspace
              permissions.
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[12px] text-danger"
            >
              {error}
            </div>
          ) : null}

          {jobActive ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-3 text-[12px] text-brand">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
              Generating a new database draft…
            </div>
          ) : dirty ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-3 text-[12px] text-brand">
              <Sparkles size={16} />
              AI-generated draft. Review and edit before you approve. Nothing is
              saved yet.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setView("entities")}
                className={
                  view === "entities"
                    ? "text-[13px] font-semibold text-brand"
                    : "text-[13px] text-ink-muted hover:text-ink"
                }
              >
                Entities
              </button>
              <button
                type="button"
                onClick={() => setView("sql")}
                className={
                  view === "sql"
                    ? "text-[13px] font-semibold text-brand"
                    : "text-[13px] text-ink-muted hover:text-ink"
                }
              >
                SQL preview
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">PostgreSQL</Badge>
              <Badge tone="neutral">
                {displayed.entities.length} entities ·{" "}
                {displayed.relationships.length} relationships
              </Badge>
              <Badge tone="brand">Requirements approved</Badge>
            </div>
          </div>

          {view === "entities" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayed.entities.map((entity, entityIndex) => {
                const constraints = entity.fields
                  .filter((field) => field.unique)
                  .map((field) => `${field.name} is unique`)
                  .join(" · ");

                return (
                  <Card key={`${entity.name}-${entityIndex}`} className="p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={entity.name}
                            onChange={(event) =>
                              updateEntity(
                                entityIndex,
                                "name",
                                event.target.value,
                              )
                            }
                            className="font-mono"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEntity(entityIndex)}
                            aria-label="Remove entity"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                        <Input
                          value={entity.description}
                          onChange={(event) =>
                            updateEntity(
                              entityIndex,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Entity purpose"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-[13px] font-bold text-ink">
                            {entity.name}
                          </p>
                          <span className="text-[10px] text-ink-muted">
                            {entity.fields.length} fields
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-ink-muted">
                          {entity.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_60px_40px_34px] gap-2 border-b border-line pb-1 font-mono text-[9px] text-ink-muted">
                      <span>FIELD</span>
                      <span>TYPE</span>
                      <span>KEY</span>
                      <span>REQ</span>
                    </div>

                    <div className="divide-y divide-line">
                      {entity.fields.map((field, fieldIndex) =>
                        isEditing ? (
                          <div
                            key={`${field.name}-${fieldIndex}`}
                            className="space-y-2 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Input
                                value={field.name}
                                onChange={(event) =>
                                  updateField(entityIndex, fieldIndex, {
                                    name: event.target.value,
                                  })
                                }
                                className="font-mono"
                              />
                              <select
                                value={field.type}
                                onChange={(event) =>
                                  updateField(entityIndex, fieldIndex, {
                                    type: event.target.value,
                                  })
                                }
                                className="h-10 rounded-lg border border-line bg-surface px-2 font-mono text-[11px] text-ink outline-none focus:border-brand"
                              >
                                {FIELD_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeField(entityIndex, fieldIndex)
                                }
                                aria-label="Remove field"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-ink-soft">
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(event) =>
                                    updateField(entityIndex, fieldIndex, {
                                      required: event.target.checked,
                                    })
                                  }
                                  className="h-3.5 w-3.5 accent-brand"
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={Boolean(field.unique)}
                                  onChange={(event) =>
                                    updateField(entityIndex, fieldIndex, {
                                      unique: event.target.checked,
                                    })
                                  }
                                  className="h-3.5 w-3.5 accent-brand"
                                />
                                Unique
                              </label>
                            </div>
                            <Input
                              value={field.description ?? ""}
                              onChange={(event) =>
                                updateField(entityIndex, fieldIndex, {
                                  description: event.target.value,
                                })
                              }
                              placeholder="Field description"
                            />
                          </div>
                        ) : (
                          <div
                            key={`${field.name}-${fieldIndex}`}
                            className="grid grid-cols-[minmax(0,1fr)_60px_40px_34px] items-start gap-2 py-1.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-mono text-[11px] text-ink">
                                {field.name}
                              </p>
                              {field.description ? (
                                <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-muted">
                                  {field.description}
                                </p>
                              ) : null}
                            </div>
                            <span className="pt-0.5 font-mono text-[10px] text-ink-muted">
                              {field.type}
                            </span>
                            <span className="pt-0.5 font-mono text-[9px] text-brand">
                              {fieldKey(field)}
                            </span>
                            <span
                              className="pt-0.5 font-mono text-[9px] text-ink-muted"
                              title={field.required ? "Not null" : "Nullable"}
                            >
                              {field.required ? "NN" : "—"}
                            </span>
                          </div>
                        ),
                      )}
                    </div>

                    {isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Plus size={13} />}
                        onClick={() => addField(entityIndex)}
                        className="mt-2"
                      >
                        Add field
                      </Button>
                    ) : constraints ? (
                      <p className="mt-3 border-t border-line pt-2 text-[10px] text-ink-muted">
                        {constraints}
                      </p>
                    ) : null}
                  </Card>
                );
              })}

              {isEditing ? (
                <Button
                  variant="secondary"
                  leftIcon={<Plus size={15} />}
                  onClick={addEntity}
                  className="h-full min-h-[120px]"
                >
                  Add entity
                </Button>
              ) : null}
              </div>

              {displayed.relationships.length > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[14px] font-semibold text-ink">
                        Relationships
                      </h2>
                      <span className="font-mono text-[11px] text-ink-muted">
                        {displayed.relationships.length}
                      </span>
                    </div>
                    <div className="mt-4 divide-y divide-line">
                      {displayed.relationships.map((relation, index) => (
                        <div
                          key={`${relation.from}-${relation.to}-${index}`}
                          className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                          <span className="font-mono text-[11px] text-ink">
                            {relation.from}
                          </span>
                          <ArrowRight size={14} className="text-ink-muted" />
                          <span className="font-mono text-[11px] text-ink">
                            {relation.to}
                          </span>
                          <Badge tone="neutral">{relation.type}</Badge>
                          {relation.description ? (
                            <span className="text-[11px] text-ink-muted">
                              {relation.description}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {displayed.indexes && displayed.indexes.length > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[14px] font-semibold text-ink">
                        Indexes
                      </h2>
                      <span className="font-mono text-[11px] text-ink-muted">
                        {displayed.indexes.length}
                      </span>
                    </div>
                    <div className="mt-4 divide-y divide-line">
                      {displayed.indexes.map((index, itemIndex) => (
                        <div
                          key={`${index.entity}-${itemIndex}`}
                          className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                          <span className="font-mono text-[11px] text-ink">
                            {index.entity}
                          </span>
                          <span className="font-mono text-[10px] text-ink-muted">
                            {index.fields.join(", ")}
                          </span>
                          {index.unique ? (
                            <Badge tone="brand">Unique</Badge>
                          ) : (
                            <Badge tone="neutral">Index</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy size={14} />}
                  onClick={() => void copySql()}
                >
                  {copied ? "Copied" : "Copy SQL"}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-[11px] leading-relaxed text-ink-soft">
                {buildSql(displayed) || "No SQL generated yet."}
              </pre>
            </div>
          )}
        </div>
      </div>

      <StickyApprovalBar
        statusLabel={statusLabel}
        nextLabel={nextLabel}
        onRegenerate={() => void queueGeneration(true)}
        onEdit={handleEdit}
        onApprove={() => void handleApprove()}
        onCancel={handleCancel}
        regenerating={generating || jobActive}
        saving={saving}
        canApprove={dirty}
        editing={isEditing}
      />
    </div>
  );
}
