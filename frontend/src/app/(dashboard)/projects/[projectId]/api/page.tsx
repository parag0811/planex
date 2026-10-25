"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Copy, Sparkles } from "lucide-react";
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
  buildOpenApi,
  EMPTY_API,
  groupRoutes,
  normalizeApi,
  type ApiContent,
  type HttpMethod,
} from "@/src/lib/api-content";
import { cn } from "@/src/lib/cn";
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

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

const pretty = (value: unknown) => {
  if (value === undefined || value === null) return "{}";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
  const activeRoute = displayed.rest[selected] ?? displayed.rest[0];

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
    : hasSection
      ? { label: "Approved · Saved", tone: "brand" as const }
      : { label: "Empty", tone: "neutral" as const };

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

    setSaving(true);
    setError(null);

    try {
      const payload = preview ?? content;
      await dispatch(
        upsertSection({ projectId, type: "api", content: payload }),
      ).unwrap();

      setContent(payload);
      setSavedContent(payload);
      setPreview(null);
      setIsEditing(false);
      setHasSection(true);
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
    setIsEditing(true);
  };

  const handleCancel = () => {
    setContent(savedContent);
    setPreview(null);
    setIsEditing(false);
    setError(null);
  };

  const updateRoute = (
    field: "name" | "method" | "path" | "description",
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      rest: prev.rest.map((route, index) =>
        index === selected ? { ...route, [field]: value } : route,
      ),
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

  if (displayed.rest.length === 0 && !jobActive) {
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
              AI-generated draft. Review and edit before you approve. Nothing is
              saved yet.
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
                Endpoints <span className="font-mono text-[11px]">{displayed.rest.length}</span>
              </button>
              {displayed.realtime.length > 0 ? (
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
                        const active = index === selected;
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

                <Card className="p-4">
                  <p className="text-[12px] font-semibold text-ink">
                    Authentication
                  </p>
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
                </Card>
              </div>

              {activeRoute ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                          METHOD_CLASSES[activeRoute.method],
                        )}
                      >
                        {activeRoute.method}
                      </span>
                      {isEditing ? (
                        <Input
                          value={activeRoute.name}
                          onChange={(event) =>
                            updateRoute("name", event.target.value)
                          }
                          className="max-w-xs"
                        />
                      ) : (
                        <h2 className="text-[15px] font-semibold text-ink">
                          {activeRoute.name}
                        </h2>
                      )}
                      {activeRoute.authRequired ? (
                        <Badge tone="neutral">Auth required</Badge>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
                        <select
                          value={activeRoute.method}
                          onChange={(event) =>
                            updateRoute("method", event.target.value)
                          }
                          className="h-10 rounded-lg border border-line bg-surface px-2 font-mono text-[11px] text-ink outline-none focus:border-brand"
                        >
                          {METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={activeRoute.path}
                          onChange={(event) =>
                            updateRoute("path", event.target.value)
                          }
                          className="font-mono"
                        />
                      </div>
                    ) : (
                      <p className="mt-2 font-mono text-[11px] text-ink-soft">
                        {activeRoute.path}
                      </p>
                    )}

                    {isEditing ? (
                      <Input
                        value={activeRoute.description}
                        onChange={(event) =>
                          updateRoute("description", event.target.value)
                        }
                        className="mt-3"
                        placeholder="Endpoint description"
                      />
                    ) : (
                      <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
                        {activeRoute.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-4">
                      {activeRoute.request?.body !== undefined ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] text-ink">Request body</p>
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
                            <p className="text-[12px] text-ink">Path params</p>
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
                            <p className="text-[12px] text-ink">Query params</p>
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
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : view === "realtime" ? (
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
        canApprove={dirty}
        editing={isEditing}
      />
    </div>
  );
}
