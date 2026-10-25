"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Copy,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Skeleton,
  Textarea,
} from "@/src/components/ui";
import { StickyApprovalBar } from "@/src/components/workspace/sticky-approval-bar";
import { useJobPolling } from "@/src/hooks/useJobPolling";
import {
  buildOpenApi,
  EMPTY_API,
  groupRoutes,
  normalizeApi,
  type ApiContent,
  type HttpMethod,
} from "@/src/lib/api-content";
import { cn } from "@/src/lib/cn";
import {
  ApiEditorSchema,
  HTTP_METHODS,
  getApiFieldErrors,
} from "@/src/lib/schemas/api.schema";
import { generateApi } from "@/src/store/slices/jobSlice";
import { fetchProjectById } from "@/src/store/slices/projectSlice";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const METHOD_CLASSES: Record<HttpMethod, string> = {
  GET: "bg-brand-soft text-brand",
  POST: "bg-info-soft text-info",
  PUT: "bg-warning-soft text-warning",
  PATCH: "bg-surface-muted text-ink-soft",
  DELETE: "bg-danger-soft text-danger",
};

const AUTH_TYPES = ["JWT", "OAuth", "Session"];

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-xs text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 aria-invalid:border-danger";

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

const pretty = (value: unknown) => {
  if (value === undefined) return "{}";
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
};

const jsonText = (value: unknown) =>
  value === undefined ? "" : pretty(value);

function InlineError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-[11px] leading-relaxed text-danger">
      {message}
    </p>
  );
}

function JsonEditor({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[12px] text-ink">
          {label}
        </label>
        <span className="font-mono text-[10px] text-ink-muted">{hint}</span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 font-mono text-[11px]"
        placeholder="{}"
        invalid={Boolean(error)}
      />
      <InlineError message={error} />
    </div>
  );
}

const uniqueEventName = (names: string[]) => {
  const existing = new Set(names.map((name) => name.trim().toLowerCase()));
  if (!existing.has("new-event")) return "new-event";

  let suffix = 2;
  while (existing.has(`new-event-${suffix}`)) suffix += 1;
  return `new-event-${suffix}`;
};

export default function ApiPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const sectionRecord = useSelector(
    (state: RootState) => state.section.projects[projectId]?.api,
  );
  const job = useSelector((state: RootState) => state.job.jobs.api);
  const project = useSelector((state: RootState) => state.project.currentProject);

  const [content, setContent] = useState<ApiContent>(EMPTY_API);
  const [savedContent, setSavedContent] = useState<ApiContent>(EMPTY_API);
  const [preview, setPreview] = useState<ApiContent | null>(null);
  const [hasSection, setHasSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [view, setView] = useState<"endpoints" | "realtime" | "openapi">(
    "endpoints",
  );
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [jsonDrafts, setJsonDrafts] = useState<Record<string, string>>({});
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  useJobPolling({
    jobId,
    status: job?.status ?? "idle",
    section: "api",
    timeoutMessage: "API generation is taking longer than expected.",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(
          fetchSectionByType({ projectId, type: "api" }),
        ).unwrap();

        if (result.section?.content && !cancelled) {
          const normalized = normalizeApi(result.section.content);
          setContent(normalized);
          setSavedContent(normalized);
          setHasSection(true);
          const preferred = normalized.rest.findIndex(
            (route) =>
              route.method === "POST" && route.path.includes("feedback"),
          );
          setSelected(preferred >= 0 ? preferred : 0);
        }
      } catch {
        // 404 means the API has not been generated yet.
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
      const payload = (job.result as { api?: unknown })?.api ?? job.result;
      const normalized = normalizeApi(payload);
      setPreview(normalized);
      setError(null);
      setGenerating(false);
      setJsonDrafts({});
      setJsonErrors({});
      const preferred = normalized.rest.findIndex(
        (route) => route.method === "POST" && route.path.includes("feedback"),
      );
      setSelected(preferred >= 0 ? preferred : 0);
    }

    if (job?.status === "failed" || job?.status === "timed_out") {
      setError(
        job.error ||
          (job.status === "timed_out"
            ? "API generation is taking longer than expected."
            : "API generation failed. Please retry."),
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
  const groups = useMemo(() => groupRoutes(displayed.rest), [displayed.rest]);
  const activeIndex = displayed.rest[selected] ? selected : 0;
  const activeRoute = displayed.rest[activeIndex];

  const validation = useMemo(
    () => ApiEditorSchema.safeParse(content),
    [content],
  );
  const previewValidation = useMemo(
    () => (preview ? ApiEditorSchema.safeParse(preview) : null),
    [preview],
  );

  const fieldErrors = validation.success
    ? {}
    : getApiFieldErrors(validation.error);
  const previewErrors =
    previewValidation && !previewValidation.success
      ? getApiFieldErrors(previewValidation.error)
      : {};
  const jsonErrorCount = Object.keys(jsonErrors).length;
  const canSave =
    (preview ? Boolean(previewValidation?.success) : validation.success) &&
    jsonErrorCount === 0;
  const invalidCount =
    (preview
      ? Object.keys(previewErrors).length
      : Object.keys(fieldErrors).length) + jsonErrorCount;
  const showValidationWarning = dirty && !canSave;

  const statusLabel = dirty
    ? "Draft not saved"
    : hasSection
      ? "Approved · Saved"
      : "Draft not saved";
  const nextLabel =
    hasSection && !preview
      ? "Next stage: Folder Structure"
      : "Next after approval: Folder Structure";
  const stageBadge = preview
    ? { label: "AI draft", tone: "warning" as const }
    : isEditing
      ? { label: "Draft · Not saved", tone: "warning" as const }
      : hasSection
        ? { label: "Approved · Saved", tone: "brand" as const }
        : { label: "Empty", tone: "neutral" as const };

  const resetJsonState = () => {
    setJsonDrafts({});
    setJsonErrors({});
  };

  const queueGeneration = async (forceRegenerate: boolean) => {
    setGenerating(true);
    setError(null);

    try {
      const queued = await dispatch(
        generateApi({ projectId, forceRegenerate }),
      ).unwrap();

      if (queued.jobId) {
        setJobId(queued.jobId);
      } else if (queued.cachedData) {
        setPreview(normalizeApi(queued.cachedData));
        setGenerating(false);
        resetJsonState();
      } else {
        setGenerating(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate the API."));
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!dirty) return;

    const source = preview ?? content;
    const result = ApiEditorSchema.safeParse(source);

    if (!result.success || jsonErrorCount > 0) {
      setError(
        jsonErrorCount > 0
          ? "Fix the highlighted JSON fields before approving."
          : preview
            ? "This draft is missing required fields. Fix the highlighted fields before saving."
            : "Fix the highlighted fields before approving.",
      );
      if (preview) {
        setContent(preview);
        setPreview(null);
        setIsEditing(true);
      }
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = result.data;
      await dispatch(
        upsertSection({ projectId, type: "api", content: payload }),
      ).unwrap();

      setContent(payload);
      setSavedContent(payload);
      setPreview(null);
      setIsEditing(false);
      setHasSection(true);
      resetJsonState();
      dispatch(fetchProjectById(projectId));
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the API."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (preview) {
      setContent(preview);
      setPreview(null);
    }
    resetJsonState();
    setIsEditing(true);
  };

  const handleCancel = () => {
    setContent(savedContent);
    setPreview(null);
    setIsEditing(false);
    setError(null);
    resetJsonState();
  };

  const updateRoute = (
    field: "name" | "method" | "path" | "description",
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      rest: prev.rest.map((route, index) =>
        index === activeIndex
          ? {
              ...route,
              [field]: field === "method" ? (value as HttpMethod) : value,
            }
          : route,
      ),
    }));
  };

  const updateRouteAuth = (authRequired: boolean) => {
    setContent((prev) => ({
      ...prev,
      rest: prev.rest.map((route, index) =>
        index === activeIndex ? { ...route, authRequired } : route,
      ),
    }));
  };

  const updateRouteRequest = (
    field: "body" | "params" | "query",
    value: unknown,
  ) => {
    setContent((prev) => ({
      ...prev,
      rest: prev.rest.map((route, index) => {
        if (index !== activeIndex) return route;

        const request = { ...(route.request ?? {}) };
        if (value === undefined) {
          delete request[field];
        } else {
          request[field] = value;
        }

        return {
          ...route,
          request: Object.keys(request).length > 0 ? request : undefined,
        };
      }),
    }));
  };

  const updateRouteResponse = (value: unknown) => {
    setContent((prev) => ({
      ...prev,
      rest: prev.rest.map((route, index) =>
        index === activeIndex ? { ...route, response: { success: value } } : route,
      ),
    }));
  };

  const updateJson = (
    key: string,
    text: string,
    apply: (value: unknown) => void,
  ) => {
    setJsonDrafts((prev) => ({ ...prev, [key]: text }));

    if (!text.trim()) {
      apply(undefined);
      setJsonErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      apply(parsed);
      setJsonErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      setJsonErrors((prev) => ({ ...prev, [key]: "Enter valid JSON." }));
    }
  };

  const addRoute = () => {
    setContent((prev) => {
      const existing = new Set(
        prev.rest.map((route) => route.path.toLowerCase()),
      );
      let path = "/new-endpoint";
      let suffix = 2;
      while (existing.has(path.toLowerCase())) {
        path = `/new-endpoint-${suffix}`;
        suffix += 1;
      }

      return {
        ...prev,
        rest: [
          ...prev.rest,
          {
            name: "New endpoint",
            method: "GET",
            path,
            description: "",
            request: undefined,
            response: { success: {} },
            authRequired: true,
          },
        ],
      };
    });
    setSelected(content.rest.length);
    resetJsonState();
  };

  const removeRoute = (index: number) => {
    setContent((prev) => ({
      ...prev,
      rest: prev.rest.filter((_, routeIndex) => routeIndex !== index),
    }));
    setSelected((current) => {
      const nextLength = Math.max(0, content.rest.length - 1);
      if (nextLength === 0) return 0;
      if (current > index) return current - 1;
      return Math.min(current, nextLength - 1);
    });
    resetJsonState();
  };

  const addRealtimeEvent = () => {
    setContent((prev) => ({
      ...prev,
      realtime: [
        ...prev.realtime,
        {
          name: uniqueEventName(prev.realtime.map((event) => event.name)),
          description: "",
          payload: {},
        },
      ],
    }));
    resetJsonState();
  };

  const updateRealtimeEvent = (
    index: number,
    patch: Partial<ApiContent["realtime"][number]>,
  ) => {
    setContent((prev) => ({
      ...prev,
      realtime: prev.realtime.map((event, eventIndex) =>
        eventIndex === index ? { ...event, ...patch } : event,
      ),
    }));
  };

  const removeRealtimeEvent = (index: number) => {
    setContent((prev) => ({
      ...prev,
      realtime: prev.realtime.filter((_, eventIndex) => eventIndex !== index),
    }));
    resetJsonState();
  };

  const updateAuth = (patch: Partial<ApiContent["auth"]>) => {
    setContent((prev) => ({
      ...prev,
      auth: { ...prev.auth, ...patch },
    }));
  };

  const addAuthRoute = () => {
    setContent((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        routes: [...prev.auth.routes, "/auth/new"],
      },
    }));
  };

  const updateAuthRoute = (index: number, value: string) => {
    setContent((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        routes: prev.auth.routes.map((route, routeIndex) =>
          routeIndex === index ? value : route,
        ),
      },
    }));
  };

  const removeAuthRoute = (index: number) => {
    setContent((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        routes: prev.auth.routes.filter(
          (_, routeIndex) => routeIndex !== index,
        ),
      },
    }));
  };

  const copyOpenApi = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(buildOpenApi(displayed), null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the OpenAPI document.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (
    displayed.rest.length === 0 &&
    displayed.realtime.length === 0 &&
    !jobActive &&
    !isEditing
  ) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-8">
        <Card className="w-full max-w-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-lg font-semibold text-ink">No API yet</h1>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Approve the Database stage first, then Planex can draft the
              endpoints for {projectName}.
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
                Generate API
              </Button>
              <Link
                href={`/projects/${projectId}/database`}
                className="text-[12px] text-brand hover:underline"
              >
                Review Database
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
                BLUEPRINT / 03 OF 04
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={stageBadge.tone}>{stageBadge.label}</Badge>
                <span className="text-[11px] text-ink-muted">
                  Version {version}
                </span>
              </div>
            </div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              API
            </h1>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Purposeful endpoints, grounded in your approved requirements and
              schema.
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
              Generating a new API draft…
            </div>
          ) : dirty ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-3 text-[12px] text-brand">
              <Sparkles size={16} />
              {isEditing
                ? "Editing the API contract. Fix any highlighted fields, then approve to save."
                : "AI-generated draft. Review and edit before you approve. Nothing is saved yet."}
            </div>
          ) : null}

          {showValidationWarning ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[12px] text-danger"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                {invalidCount === 1
                  ? "1 field needs attention"
                  : `${invalidCount} fields need attention`}
                {preview
                  ? " in this AI draft. Choose Edit to fix them before saving."
                  : " before you can approve this section."}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setView("endpoints")}
                className={
                  view === "endpoints"
                    ? "text-[13px] font-semibold text-brand"
                    : "text-[13px] text-ink-muted hover:text-ink"
                }
              >
                Endpoints{" "}
                <span className="font-mono text-[11px]">
                  {displayed.rest.length}
                </span>
              </button>
              {displayed.realtime.length > 0 || isEditing ? (
                <button
                  type="button"
                  onClick={() => setView("realtime")}
                  className={
                    view === "realtime"
                      ? "text-[13px] font-semibold text-brand"
                      : "text-[13px] text-ink-muted hover:text-ink"
                  }
                >
                  Realtime{" "}
                  <span className="font-mono text-[11px]">
                    {displayed.realtime.length}
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setView("openapi")}
                className={
                  view === "openapi"
                    ? "text-[13px] font-semibold text-brand"
                    : "text-[13px] text-ink-muted hover:text-ink"
                }
              >
                OpenAPI preview
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{displayed.auth.description}</Badge>
            </div>
          </div>

          {view === "endpoints" ? (
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-3">
                {fieldErrors.rest ? (
                  <InlineError message={fieldErrors.rest} />
                ) : null}

                {groups.map((group) => (
                  <Card key={group.name} className="p-4">
                    <p className="text-[12px] font-semibold text-ink">
                      {group.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">
                      {group.purpose}
                    </p>
                    <div className="mt-2 space-y-1">
                      {group.routes.map((route) => {
                        const index = displayed.rest.indexOf(route);
                        const active = index === activeIndex;
                        return (
                          <button
                            key={`${route.method}-${route.path}-${index}`}
                            type="button"
                            onClick={() => setSelected(index)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                              active
                                ? "bg-brand-soft"
                                : "hover:bg-surface-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "w-12 shrink-0 rounded px-1 py-0.5 text-center font-mono text-[9px] font-bold",
                                METHOD_CLASSES[route.method],
                              )}
                            >
                              {route.method}
                            </span>
                            <span className="truncate font-mono text-[11px] text-ink">
                              {route.path}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}

                {isEditing ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={addRoute}
                    className="w-full"
                  >
                    Add endpoint
                  </Button>
                ) : null}

                <Card className="p-4">
                  <p className="text-[12px] font-semibold text-ink">
                    Authentication
                  </p>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <Field
                        label="Type"
                        htmlFor="auth-type"
                        error={fieldErrors["auth.type"]}
                      >
                        <select
                          id="auth-type"
                          value={displayed.auth.type}
                          onChange={(event) =>
                            updateAuth({ type: event.target.value })
                          }
                          aria-invalid={Boolean(fieldErrors["auth.type"])}
                          className={SELECT_CLASS}
                        >
                          {AUTH_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                          {!AUTH_TYPES.includes(displayed.auth.type) ? (
                            <option value={displayed.auth.type}>
                              {displayed.auth.type}
                            </option>
                          ) : null}
                        </select>
                      </Field>

                      <Field label="Description" htmlFor="auth-description">
                        <Input
                          id="auth-description"
                          value={displayed.auth.description}
                          onChange={(event) =>
                            updateAuth({ description: event.target.value })
                          }
                          placeholder="Bearer authentication"
                        />
                      </Field>

                      <div>
                        <p className="text-[12px] text-ink">
                          Protected routes
                        </p>
                        <div className="mt-1 space-y-1">
                          {displayed.auth.routes.map((route, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={route}
                                  onChange={(event) =>
                                    updateAuthRoute(index, event.target.value)
                                  }
                                  aria-label={`Auth route ${index + 1}`}
                                  invalid={Boolean(
                                    fieldErrors[`auth.routes.${index}`],
                                  )}
                                  className="font-mono"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAuthRoute(index)}
                                  aria-label="Remove auth route"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                              <InlineError
                                message={fieldErrors[`auth.routes.${index}`]}
                              />
                            </div>
                          ))}
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus size={14} />}
                            onClick={addAuthRoute}
                          >
                            Add route
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        {displayed.auth.type} · {displayed.auth.description}
                      </p>
                      {displayed.auth.routes.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {displayed.auth.routes.map((route) => (
                            <Badge
                              key={route}
                              tone="neutral"
                              className="font-mono"
                            >
                              {route}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </Card>
              </div>

              {activeRoute ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                            METHOD_CLASSES[activeRoute.method],
                          )}
                        >
                          {activeRoute.method}
                        </span>

                        {isEditing ? (
                          <div className="min-w-0 space-y-1">
                            <Input
                              value={activeRoute.name}
                              onChange={(event) =>
                                updateRoute("name", event.target.value)
                              }
                              aria-label="Endpoint name"
                              invalid={Boolean(
                                fieldErrors[`rest.${activeIndex}.name`],
                              )}
                              className="max-w-xs"
                            />
                            <InlineError
                              message={fieldErrors[`rest.${activeIndex}.name`]}
                            />
                          </div>
                        ) : (
                          <h2 className="text-[15px] font-semibold text-ink">
                            {activeRoute.name}
                          </h2>
                        )}

                        {isEditing ? (
                          <label className="mt-1 flex items-center gap-2 text-[11px] text-ink-soft">
                            <input
                              type="checkbox"
                              checked={Boolean(activeRoute.authRequired)}
                              onChange={(event) =>
                                updateRouteAuth(event.target.checked)
                              }
                              className="h-3.5 w-3.5 accent-brand"
                            />
                            Auth required
                          </label>
                        ) : activeRoute.authRequired ? (
                          <Badge tone="neutral">Auth required</Badge>
                        ) : null}
                      </div>

                      {isEditing ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() => removeRoute(activeIndex)}
                        >
                          Delete endpoint
                        </Button>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
                        <select
                          value={activeRoute.method}
                          onChange={(event) =>
                            updateRoute("method", event.target.value)
                          }
                          aria-label="Endpoint method"
                          className="h-10 rounded-lg border border-line bg-surface px-2 font-mono text-[11px] text-ink outline-none focus:border-brand"
                        >
                          {HTTP_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                        <div className="space-y-1">
                          <Input
                            value={activeRoute.path}
                            onChange={(event) =>
                              updateRoute("path", event.target.value)
                            }
                            aria-label="Endpoint path"
                            invalid={Boolean(
                              fieldErrors[`rest.${activeIndex}.path`],
                            )}
                            className="font-mono"
                          />
                          <InlineError
                            message={fieldErrors[`rest.${activeIndex}.path`]}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 font-mono text-[11px] text-ink-soft">
                        {activeRoute.path}
                      </p>
                    )}

                    {isEditing ? (
                      <Textarea
                        value={activeRoute.description}
                        onChange={(event) =>
                          updateRoute("description", event.target.value)
                        }
                        aria-label="Endpoint description"
                        className="mt-3"
                        rows={2}
                        placeholder="Endpoint description"
                      />
                    ) : (
                      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
                        {activeRoute.description}
                      </p>
                    )}

                    {isEditing ? (
                      <div className="mt-5 space-y-4">
                        <JsonEditor
                          id="request-body"
                          label="Request body"
                          hint="application/json"
                          value={jsonText(
                            jsonDrafts[`route.${activeIndex}.body`] ??
                              activeRoute.request?.body,
                          )}
                          error={jsonErrors[`route.${activeIndex}.body`]}
                          onChange={(text) =>
                            updateJson(
                              `route.${activeIndex}.body`,
                              text,
                              (value) => updateRouteRequest("body", value),
                            )
                          }
                        />
                        <JsonEditor
                          id="request-params"
                          label="Path params"
                          hint="params"
                          value={jsonText(
                            jsonDrafts[`route.${activeIndex}.params`] ??
                              activeRoute.request?.params,
                          )}
                          error={jsonErrors[`route.${activeIndex}.params`]}
                          onChange={(text) =>
                            updateJson(
                              `route.${activeIndex}.params`,
                              text,
                              (value) => updateRouteRequest("params", value),
                            )
                          }
                        />
                        <JsonEditor
                          id="request-query"
                          label="Query params"
                          hint="query"
                          value={jsonText(
                            jsonDrafts[`route.${activeIndex}.query`] ??
                              activeRoute.request?.query,
                          )}
                          error={jsonErrors[`route.${activeIndex}.query`]}
                          onChange={(text) =>
                            updateJson(
                              `route.${activeIndex}.query`,
                              text,
                              (value) => updateRouteRequest("query", value),
                            )
                          }
                        />
                        <JsonEditor
                          id="response-success"
                          label="Response"
                          hint="200 OK"
                          value={jsonText(
                            jsonDrafts[`route.${activeIndex}.response`] ??
                              activeRoute.response?.success,
                          )}
                          error={jsonErrors[`route.${activeIndex}.response`]}
                          onChange={(text) =>
                            updateJson(
                              `route.${activeIndex}.response`,
                              text,
                              updateRouteResponse,
                            )
                          }
                        />
                      </div>
                    ) : (
                      <div className="mt-5 space-y-4">
                        {activeRoute.request?.body !== undefined ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] text-ink">
                                Request body
                              </p>
                              <span className="font-mono text-[10px] text-ink-muted">
                                application/json
                              </span>
                            </div>
                            <pre className="mt-2 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                              {pretty(activeRoute.request.body)}
                            </pre>
                          </div>
                        ) : null}

                        {activeRoute.request?.params !== undefined ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] text-ink">
                                Path params
                              </p>
                              <span className="font-mono text-[10px] text-ink-muted">
                                params
                              </span>
                            </div>
                            <pre className="mt-2 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                              {pretty(activeRoute.request.params)}
                            </pre>
                          </div>
                        ) : null}

                        {activeRoute.request?.query !== undefined ? (
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] text-ink">
                                Query params
                              </p>
                              <span className="font-mono text-[10px] text-ink-muted">
                                query
                              </span>
                            </div>
                            <pre className="mt-2 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                              {pretty(activeRoute.request.query)}
                            </pre>
                          </div>
                        ) : null}

                        {activeRoute.request?.body === undefined &&
                        activeRoute.request?.params === undefined &&
                        activeRoute.request?.query === undefined ? (
                          <p className="text-[11px] text-ink-muted">
                            No request payload.
                          </p>
                        ) : null}

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] text-ink">Response</p>
                            <Badge tone="brand">200 OK</Badge>
                          </div>
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                            {pretty(activeRoute.response?.success)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-[13px] font-semibold text-ink">
                      No endpoint selected
                    </p>
                    <p className="max-w-sm text-[12px] leading-relaxed text-ink-muted">
                      Add an endpoint to start defining the API contract.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus size={14} />}
                      onClick={addRoute}
                    >
                      Add endpoint
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : view === "realtime" ? (
            isEditing ? (
              <div className="space-y-4">
                {displayed.realtime.length === 0 ? (
                  <p className="text-[12px] text-ink-muted">
                    No realtime events yet. Add one to document a socket event.
                  </p>
                ) : null}

                {displayed.realtime.map((event, index) => (
                  <Card key={index}>
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <Input
                            value={event.name}
                            onChange={(changeEvent) =>
                              updateRealtimeEvent(index, {
                                name: changeEvent.target.value,
                              })
                            }
                            aria-label={`Event ${index + 1} name`}
                            invalid={Boolean(
                              fieldErrors[`realtime.${index}.name`],
                            )}
                            className="font-mono"
                          />
                          <InlineError
                            message={fieldErrors[`realtime.${index}.name`]}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRealtimeEvent(index)}
                          aria-label="Remove realtime event"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>

                      <Input
                        value={event.description}
                        onChange={(changeEvent) =>
                          updateRealtimeEvent(index, {
                            description: changeEvent.target.value,
                          })
                        }
                        aria-label={`Event ${index + 1} description`}
                        placeholder="Event description"
                      />

                      <JsonEditor
                        id={`realtime-payload-${index}`}
                        label="Payload"
                        hint="application/json"
                        value={jsonText(
                          jsonDrafts[`realtime.${index}.payload`] ??
                            event.payload,
                        )}
                        error={jsonErrors[`realtime.${index}.payload`]}
                        onChange={(text) =>
                          updateJson(
                            `realtime.${index}.payload`,
                            text,
                            (value) =>
                              updateRealtimeEvent(index, { payload: value }),
                          )
                        }
                      />
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="secondary"
                  leftIcon={<Plus size={15} />}
                  onClick={addRealtimeEvent}
                >
                  Add realtime event
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {displayed.realtime.map((event, index) => (
                  <Card key={`${event.name}-${index}`}>
                    <CardContent className="p-5">
                      <p className="font-mono text-[12px] font-semibold text-ink">
                        {event.name}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                        {event.description}
                      </p>
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                        {pretty(event.payload)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy size={14} />}
                  onClick={() => void copyOpenApi()}
                >
                  {copied ? "Copied" : "Copy OpenAPI"}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-[11px] leading-relaxed text-ink-soft">
                {JSON.stringify(buildOpenApi(displayed), null, 2)}
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
        canApprove={dirty && canSave}
        editing={isEditing}
      />
    </div>
  );
}
