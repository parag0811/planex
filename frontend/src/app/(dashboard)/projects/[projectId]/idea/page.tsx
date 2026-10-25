"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Plus, Sparkles, Trash2 } from "lucide-react";
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
  EMPTY_IDEA,
  normalizeIdea,
  STACK_KEYS,
  type IdeaSectionContent,
  type StackCategory,
} from "@/src/lib/idea-content";
import {
  IdeaEditorSchema,
  getIdeaFieldErrors,
} from "@/src/lib/schemas/idea.schema";
import { generateIdea } from "@/src/store/slices/jobSlice";
import { fetchProjectById } from "@/src/store/slices/projectSlice";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const STACK_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  infrastructure: "Infrastructure",
  ai: "AI",
  frameworks: "Frameworks",
};

const STACK_ADD_LABELS: Record<string, string> = {
  frontend: "frontend",
  backend: "backend",
  database: "database",
  infrastructure: "infrastructure",
  ai: "AI",
  frameworks: "frameworks",
};

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

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

export default function RequirementsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const sectionRecord = useSelector(
    (state: RootState) => state.section.projects[projectId]?.idea,
  );
  const job = useSelector((state: RootState) => state.job.jobs.idea);
  const project = useSelector((state: RootState) => state.project.currentProject);

  const [content, setContent] = useState<IdeaSectionContent>(EMPTY_IDEA);
  const [savedContent, setSavedContent] =
    useState<IdeaSectionContent>(EMPTY_IDEA);
  const [preview, setPreview] = useState<IdeaSectionContent | null>(null);
  const [hasSection, setHasSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [urlJobId, setUrlJobId] = useState<string | null>(null);
  const [regenJobId, setRegenJobId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newIdea, setNewIdea] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrlJobId(new URLSearchParams(window.location.search).get("jobId"));
  }, []);

  useJobPolling({
    jobId: urlJobId ?? regenJobId,
    status: job?.status ?? "idle",
    section: "idea",
    timeoutMessage: "Requirements generation is taking longer than expected.",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(
          fetchSectionByType({ projectId, type: "idea" }),
        ).unwrap();

        if (result.section?.content && !cancelled) {
          const normalized = normalizeIdea(result.section.content);
          setContent(normalized);
          setSavedContent(normalized);
          setHasSection(true);
        }
      } catch {
        // A 404 simply means this stage has not been generated yet.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, projectId, refreshKey]);

  useEffect(() => {
    const handleSectionUpdated = (event: Event) => {
      const detail = (
        event as CustomEvent<{ projectId: string; section: string }>
      ).detail;
      if (
        detail?.projectId !== projectId ||
        detail?.section !== "idea"
      ) {
        return;
      }
      setRefreshKey((value) => value + 1);
    };

    window.addEventListener("planex:section-updated", handleSectionUpdated);
    return () =>
      window.removeEventListener(
        "planex:section-updated",
        handleSectionUpdated,
      );
  }, [projectId]);

  useEffect(() => {
    if (job?.status === "completed" && job.result) {
      const payload =
        (job.result as { idea?: unknown })?.idea ?? job.result;
      setPreview(normalizeIdea(payload));
      setError(null);
      setRegenerating(false);
      if (urlJobId) {
        window.history.replaceState({}, "", window.location.pathname);
        setUrlJobId(null);
      }
    }

    if (job?.status === "failed" || job?.status === "timed_out") {
      setError(
        job.error ||
          (job.status === "timed_out"
            ? "Requirements generation is taking longer than expected."
            : "Requirements generation failed. Please retry."),
      );
      setRegenerating(false);
      if (urlJobId) {
        window.history.replaceState({}, "", window.location.pathname);
        setUrlJobId(null);
      }
    }
  }, [job?.status, job?.result, job?.error, urlJobId]);

  const displayed = preview ?? content;
  const dirty = preview !== null || isEditing;
  const jobActive =
    job?.status === "pending" ||
    job?.status === "processing" ||
    (Boolean(urlJobId || regenJobId) && !preview && !error);
  const version = sectionRecord?.data?.version ?? 1;
  const projectName = project?.name || "this project";

  const validation = useMemo(
    () => IdeaEditorSchema.safeParse(content),
    [content],
  );
  const previewValidation = useMemo(
    () => (preview ? IdeaEditorSchema.safeParse(preview) : null),
    [preview],
  );

  const fieldErrors = validation.success
    ? {}
    : getIdeaFieldErrors(validation.error);
  const previewErrors =
    previewValidation && !previewValidation.success
      ? getIdeaFieldErrors(previewValidation.error)
      : {};

  const canSave = preview
    ? Boolean(previewValidation?.success)
    : validation.success;
  const invalidCount = preview
    ? Object.keys(previewErrors).length
    : Object.keys(fieldErrors).length;
  const showValidationWarning = dirty && !canSave;

  const statusLabel = dirty
    ? "Draft not saved"
    : hasSection
      ? "Approved · Saved"
      : "Draft not saved";

  const nextLabel =
    hasSection && !preview
      ? "Next stage: Database"
      : "Next after approval: Database";

  const stageBadge = preview
    ? { label: "AI draft", tone: "warning" as const }
    : isEditing
      ? { label: "Draft · Not saved", tone: "warning" as const }
      : hasSection
        ? { label: "Approved · Saved", tone: "brand" as const }
        : { label: "Empty", tone: "neutral" as const };

  const updateFeature = (
    index: number,
    field: "name" | "description" | "priority",
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      key_features: prev.key_features.map((feature, featureIndex) =>
        featureIndex === index ? { ...feature, [field]: value } : feature,
      ),
    }));
  };

  const addFeature = () => {
    setContent((prev) => ({
      ...prev,
      key_features: [
        ...prev.key_features,
        { name: "", description: "", priority: "nice_to_have" },
      ],
    }));
  };

  const removeFeature = (index: number) => {
    setContent((prev) => ({
      ...prev,
      key_features: prev.key_features.filter(
        (_, featureIndex) => featureIndex !== index,
      ),
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setContent((prev) => ({
      ...prev,
      requirements: prev.requirements.map((requirement, requirementIndex) =>
        requirementIndex === index ? value : requirement,
      ),
    }));
  };

  const addRequirement = () => {
    setContent((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index: number) => {
    setContent((prev) => ({
      ...prev,
      requirements: prev.requirements.filter(
        (_, requirementIndex) => requirementIndex !== index,
      ),
    }));
  };

  const updateStackItem = (
    key: StackCategory,
    index: number,
    value: string,
  ) => {
    setContent((prev) => ({
      ...prev,
      suggested_tech_stack: {
        ...prev.suggested_tech_stack,
        [key]: prev.suggested_tech_stack[key].map((item, itemIndex) =>
          itemIndex === index ? value : item,
        ),
      },
    }));
  };

  const addStackItem = (key: StackCategory) => {
    setContent((prev) => ({
      ...prev,
      suggested_tech_stack: {
        ...prev.suggested_tech_stack,
        [key]: [...prev.suggested_tech_stack[key], ""],
      },
    }));
  };

  const removeStackItem = (key: StackCategory, index: number) => {
    setContent((prev) => ({
      ...prev,
      suggested_tech_stack: {
        ...prev.suggested_tech_stack,
        [key]: prev.suggested_tech_stack[key].filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      },
    }));
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

  const handleApprove = async () => {
    if (!dirty) return;

    const source = preview ?? content;
    const result = IdeaEditorSchema.safeParse(source);

    if (!result.success) {
      setError(
        preview
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
        upsertSection({ projectId, type: "idea", content: payload }),
      ).unwrap();

      setContent(payload);
      setSavedContent(payload);
      setPreview(null);
      setIsEditing(false);
      setHasSection(true);
      dispatch(fetchProjectById(projectId));
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the requirements."));
    } finally {
      setSaving(false);
    }
  };

  const handleStartIdea = async () => {
    const idea = newIdea.trim();

    if (idea.length < 10) {
      setError("Describe the idea in at least 10 characters.");
      return;
    }

    setRegenerating(true);
    setError(null);

    try {
      const queued = await dispatch(generateIdea({ projectId, idea })).unwrap();

      if (queued.jobId) {
        setRegenJobId(queued.jobId);
      } else if (queued.cachedData) {
        const cached =
          (queued.cachedData as { idea?: unknown })?.idea ?? queued.cachedData;
        setPreview(normalizeIdea(cached));
        setRegenerating(false);
      } else {
        setRegenerating(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not start the requirements."));
      setRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    const sourceIdea = (preview ?? content).raw_idea || content.raw_idea;
    if (!sourceIdea.trim()) {
      setError("This project has no original idea to regenerate from.");
      return;
    }

    setRegenerating(true);
    setError(null);

    try {
      const queued = await dispatch(
        generateIdea({
          projectId,
          idea: sourceIdea,
          forceRegenerate: true,
        }),
      ).unwrap();

      if (queued.jobId) {
        setRegenJobId(queued.jobId);
      } else if (queued.cachedData) {
        const cached =
          (queued.cachedData as { idea?: unknown })?.idea ?? queued.cachedData;
        setPreview(normalizeIdea(cached));
        setRegenerating(false);
      } else {
        setRegenerating(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not regenerate the requirements."));
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const hasAnyContent =
    hasSection ||
    preview !== null ||
    isEditing ||
    Boolean(displayed.overview) ||
    displayed.key_features.length > 0 ||
    displayed.requirements.length > 0;

  if (!hasAnyContent && !jobActive) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-8">
        <Card className="w-full max-w-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-lg font-semibold text-ink">
                No requirements yet
              </h1>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Describe the idea for {projectName}. Planex will draft the
              requirements for you to review.
            </p>

            {error ? (
              <p className="mt-3 text-[11px] text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <Textarea
              value={newIdea}
              onChange={(event) => {
                setNewIdea(event.target.value);
                if (error) setError(null);
              }}
              rows={4}
              maxLength={1000}
              placeholder="A customer feedback hub for SaaS teams — ideas, voting and a public roadmap."
              className="mt-4"
            />

            <Button
              className="mt-4"
              onClick={() => void handleStartIdea()}
              loading={regenerating}
              disabled={newIdea.trim().length < 10}
            >
              Generate requirements
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-[880px] space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-ink-muted">
                BLUEPRINT / 01 OF 04
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={stageBadge.tone}>{stageBadge.label}</Badge>
                <span className="text-[11px] text-ink-muted">
                  Version {version}
                </span>
              </div>
            </div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Requirements
            </h1>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              A shared understanding of what {projectName} should do — and what
              it shouldn’t.
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
              Generating a new requirements draft…
            </div>
          ) : dirty ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-3 text-[12px] text-brand">
              <Sparkles size={16} />
              {isEditing
                ? "Editing requirements. Fix any highlighted fields, then approve to save."
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Product overview
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  01 / CONTEXT
                </span>
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-4">
                  <Field
                    label="Overview"
                    htmlFor="idea-overview"
                    error={fieldErrors.overview}
                  >
                    <Textarea
                      id="idea-overview"
                      value={content.overview}
                      onChange={(event) =>
                        setContent((prev) => ({
                          ...prev,
                          overview: event.target.value,
                        }))
                      }
                      rows={4}
                      invalid={Boolean(fieldErrors.overview)}
                      placeholder="What is this product, and who is it for?"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Estimated complexity"
                      htmlFor="idea-complexity"
                    >
                      <select
                        id="idea-complexity"
                        value={content.estimated_complexity}
                        onChange={(event) =>
                          setContent((prev) => ({
                            ...prev,
                            estimated_complexity: event.target
                              .value as IdeaSectionContent["estimated_complexity"],
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-xs text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </Field>

                    <Field
                      label="Team size"
                      htmlFor="idea-team-size"
                      error={fieldErrors.team_size}
                    >
                      <Input
                        id="idea-team-size"
                        value={content.team_size}
                        onChange={(event) =>
                          setContent((prev) => ({
                            ...prev,
                            team_size: event.target.value,
                          }))
                        }
                        invalid={Boolean(fieldErrors.team_size)}
                        placeholder="1-3 developers"
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                  {displayed.overview || "No overview generated yet."}
                </p>
              )}

              {!isEditing ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">
                    Complexity: {displayed.estimated_complexity}
                  </Badge>
                  <Badge tone="neutral">
                    Team: {displayed.team_size || "TBD"}
                  </Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Functional requirements
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  02 / BEHAVIOR
                </span>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-4">
                  {fieldErrors.key_features ? (
                    <InlineError message={fieldErrors.key_features} />
                  ) : null}

                  {content.key_features.map((feature, index) => {
                    const nameError =
                      fieldErrors[`key_features.${index}.name`];
                    const descriptionError =
                      fieldErrors[`key_features.${index}.description`];

                    return (
                      <div
                        key={index}
                        className="space-y-2 rounded-lg border border-line p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <Input
                              value={feature.name}
                              onChange={(event) =>
                                updateFeature(index, "name", event.target.value)
                              }
                              placeholder="Requirement title"
                              aria-label={`Requirement ${index + 1} title`}
                              invalid={Boolean(nameError)}
                            />
                            <InlineError message={nameError} />
                          </div>
                          <select
                            value={feature.priority}
                            onChange={(event) =>
                              updateFeature(
                                index,
                                "priority",
                                event.target.value,
                              )
                            }
                            aria-label={`Requirement ${index + 1} priority`}
                            className="h-10 shrink-0 rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand"
                          >
                            <option value="must_have">Must have</option>
                            <option value="nice_to_have">Nice to have</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFeature(index)}
                            aria-label="Remove requirement"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Textarea
                            value={feature.description}
                            onChange={(event) =>
                              updateFeature(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                            rows={2}
                            placeholder="Acceptance summary"
                            aria-label={`Requirement ${index + 1} description`}
                            invalid={Boolean(descriptionError)}
                          />
                          <InlineError message={descriptionError} />
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={addFeature}
                  >
                    Add requirement
                  </Button>
                </div>
              ) : displayed.key_features.length > 0 ? (
                <div className="mt-4 divide-y divide-line">
                  {displayed.key_features.map((feature, index) => (
                    <div
                      key={`${feature.name}-${index}`}
                      className="flex gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="w-14 shrink-0 font-mono text-[10px] text-ink-muted">
                        REQ-{String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[12px] text-ink">
                            {feature.name}
                          </p>
                          <Badge
                            tone={
                              feature.priority === "must_have"
                                ? "brand"
                                : "neutral"
                            }
                          >
                            {feature.priority === "must_have"
                              ? "Must have"
                              : "Nice to have"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-ink-muted">
                  No functional requirements generated yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Scope & constraints
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  03 / CONSTRAINTS
                </span>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-2">
                  {fieldErrors.requirements ? (
                    <InlineError message={fieldErrors.requirements} />
                  ) : null}

                  {content.requirements.map((requirement, index) => {
                    const requirementError =
                      fieldErrors[`requirements.${index}`];

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Input
                            value={requirement}
                            onChange={(event) =>
                              updateRequirement(index, event.target.value)
                            }
                            placeholder="System requirement or constraint"
                            aria-label={`Constraint ${index + 1}`}
                            invalid={Boolean(requirementError)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRequirement(index)}
                            aria-label="Remove constraint"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                        <InlineError message={requirementError} />
                      </div>
                    );
                  })}
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={addRequirement}
                  >
                    Add constraint
                  </Button>
                </div>
              ) : displayed.requirements.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {displayed.requirements.map((requirement, index) => (
                    <li
                      key={`${requirement}-${index}`}
                      className="flex gap-3 text-[12px] leading-relaxed text-ink-soft"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[13px] text-ink-muted">
                  No constraints generated yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Suggested stack
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  04 / STACK
                </span>
              </div>

              {isEditing ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {STACK_KEYS.map((key) => {
                    const items = content.suggested_tech_stack[key];
                    const label = STACK_LABELS[key] ?? key;

                    return (
                      <div key={key}>
                        <p className="font-mono text-[10px] text-ink-muted">
                          {label.toUpperCase()}
                        </p>
                        <div className="mt-2 space-y-2">
                          {items.map((item, index) => {
                            const itemError =
                              fieldErrors[
                                `suggested_tech_stack.${key}.${index}`
                              ];

                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={item}
                                    onChange={(event) =>
                                      updateStackItem(
                                        key,
                                        index,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={`Add ${label.toLowerCase()}`}
                                    aria-label={`${label} item ${index + 1}`}
                                    invalid={Boolean(itemError)}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeStackItem(key, index)}
                                    aria-label={`Remove ${label} item ${index + 1}`}
                                  >
                                    <Trash2 size={15} />
                                  </Button>
                                </div>
                                <InlineError message={itemError} />
                              </div>
                            );
                          })}
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus size={14} />}
                            onClick={() => addStackItem(key)}
                          >
                            Add {STACK_ADD_LABELS[key] ?? label.toLowerCase()}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {STACK_KEYS.map((key) => {
                    const items = displayed.suggested_tech_stack[key] ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={key}>
                        <p className="font-mono text-[10px] text-ink-muted">
                          {STACK_LABELS[key]?.toUpperCase() ?? key}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((item) => (
                            <Badge key={item} tone="neutral">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!STACK_KEYS.some(
                    (key) =>
                      (displayed.suggested_tech_stack[key] ?? []).length > 0,
                  ) ? (
                    <p className="text-[13px] text-ink-muted sm:col-span-2">
                      No suggested stack yet.
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Original idea
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  SOURCE
                </span>
              </div>

              {isEditing ? (
                <Textarea
                  id="idea-raw"
                  aria-label="Original idea"
                  value={content.raw_idea}
                  onChange={(event) =>
                    setContent((prev) => ({
                      ...prev,
                      raw_idea: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-3"
                  placeholder="The idea this blueprint was generated from."
                />
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                  {displayed.raw_idea || "No original idea recorded."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <StickyApprovalBar
        statusLabel={statusLabel}
        nextLabel={nextLabel}
        onRegenerate={() => void handleRegenerate()}
        onEdit={handleEdit}
        onApprove={() => void handleApprove()}
        onCancel={handleCancel}
        regenerating={regenerating || jobActive}
        saving={saving}
        canApprove={dirty && canSave}
        editing={isEditing}
      />
    </div>
  );
}
