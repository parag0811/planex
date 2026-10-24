"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Copy, FileText, Folder, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  Textarea,
} from "@/src/components/ui";
import { StickyApprovalBar } from "@/src/components/workspace/sticky-approval-bar";
import { useJobPolling } from "@/src/hooks/useJobPolling";
import {
  countFolderNodes,
  EMPTY_FOLDER,
  normalizeFolder,
  parseFolder,
  serializeFolder,
  type FolderContent,
  type FolderNode,
} from "@/src/lib/folder-content";
import { generateFolder } from "@/src/store/slices/jobSlice";
import { fetchProjectById } from "@/src/store/slices/projectSlice";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : fallback;

function TreeRows({
  nodes,
  depth = 0,
}: {
  nodes: FolderNode[];
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node, index) => (
        <div key={`${node.name}-${depth}-${index}`}>
          <div
            className="flex items-center gap-2 py-1"
            style={{ paddingLeft: `${depth * 18}px` }}
          >
            {node.type === "folder" ? (
              <Folder size={14} className="shrink-0 text-brand" />
            ) : (
              <FileText size={14} className="shrink-0 text-ink-muted" />
            )}
            <span className="font-mono text-[11px] text-ink-soft">
              {node.name}
              {node.type === "folder" ? "/" : ""}
            </span>
          </div>
          {node.children && node.children.length > 0 ? (
            <TreeRows nodes={node.children} depth={depth + 1} />
          ) : null}
        </div>
      ))}
    </>
  );
}

export default function FolderPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const sectionRecord = useSelector(
    (state: RootState) => state.section.projects[projectId]?.folder,
  );
  const job = useSelector((state: RootState) => state.job.jobs.folder);
  const project = useSelector((state: RootState) => state.project.currentProject);

  const [content, setContent] = useState<FolderContent>(EMPTY_FOLDER);
  const [savedContent, setSavedContent] =
    useState<FolderContent>(EMPTY_FOLDER);
  const [preview, setPreview] = useState<FolderContent | null>(null);
  const [hasSection, setHasSection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useJobPolling({
    jobId,
    status: job?.status ?? "idle",
    section: "folder",
    timeoutMessage: "Folder generation is taking longer than expected.",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(
          fetchSectionByType({ projectId, type: "folder" }),
        ).unwrap();

        if (result.section?.content && !cancelled) {
          const normalized = normalizeFolder(result.section.content);
          setContent(normalized);
          setSavedContent(normalized);
          setHasSection(true);
        }
      } catch {
        // 404 means the folder structure has not been generated yet.
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
        (job.result as { folder?: unknown })?.folder ?? job.result;
      setPreview(normalizeFolder(payload));
      setError(null);
      setGenerating(false);
    }

    if (job?.status === "failed" || job?.status === "timed_out") {
      setError(
        job.error ||
          (job.status === "timed_out"
            ? "Folder generation is taking longer than expected."
            : "Folder generation failed. Please retry."),
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
  const counts = countFolderNodes(displayed.root);

  const statusLabel = dirty
    ? "Draft not saved"
    : hasSection
      ? "Approved · Saved"
      : "Draft not saved";
  const nextLabel =
    hasSection && !preview
      ? "Blueprint complete"
      : "Approve to complete your blueprint";
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
        generateFolder({ projectId, forceRegenerate }),
      ).unwrap();

      if (queued.jobId) {
        setJobId(queued.jobId);
      } else if (queued.cachedData) {
        setPreview(normalizeFolder(queued.cachedData));
        setGenerating(false);
      } else {
        setGenerating(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate the folder structure."));
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
        upsertSection({ projectId, type: "folder", content: payload }),
      ).unwrap();

      setContent(payload);
      setSavedContent(payload);
      setPreview(null);
      setIsEditing(false);
      setHasSection(true);
      dispatch(fetchProjectById(projectId));
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the folder structure."));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    const source = preview ?? content;
    if (preview) {
      setContent(preview);
      setPreview(null);
    }
    setEditText(serializeFolder(source.root));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setContent(savedContent);
    setPreview(null);
    setIsEditing(false);
    setError(null);
  };

  const copyTree = async () => {
    try {
      await navigator.clipboard.writeText(serializeFolder(displayed.root));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the folder tree.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="h-[420px] rounded-lg" />
            <Skeleton className="h-[420px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (displayed.root.length === 0 && !jobActive) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-8">
        <Card className="w-full max-w-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-lg font-semibold text-ink">
                No folder structure yet
              </h1>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Approve the API stage first, then Planex can draft a practical
              project layout for {projectName}.
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
                Generate folders
              </Button>
              <Link
                href={`/projects/${projectId}/api`}
                className="text-[12px] text-brand hover:underline"
              >
                Review API
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
                BLUEPRINT / 04 OF 04
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={stageBadge.tone}>{stageBadge.label}</Badge>
                <span className="text-[11px] text-ink-muted">
                  Version {version}
                </span>
              </div>
            </div>
            <h1 className="text-[28px] font-semibold leading-tight text-ink">
              Folder Structure
            </h1>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              A practical home for every entity, endpoint and responsibility.
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
              Generating a new folder draft…
            </div>
          ) : dirty ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-3 text-[12px] text-brand">
              <Sparkles size={16} />
              AI-generated draft. Review and edit before you approve. Nothing is
              saved yet.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{counts.folders} folders</Badge>
            <Badge tone="neutral">{counts.files} files</Badge>
            <Badge tone="brand">
              Based on {project?.approvedStages ?? 0} approved stages
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <p className="text-[12px] text-ink">Project explorer</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Copy size={13} />}
                    onClick={() => void copyTree()}
                  >
                    {copied ? "Copied" : "Copy tree"}
                  </Button>
                </div>

                {isEditing ? (
                  <Textarea
                    value={editText}
                    onChange={(event) => {
                      setEditText(event.target.value);
                      setContent(parseFolder(event.target.value));
                    }}
                    rows={18}
                    className="mt-4 font-mono"
                    placeholder={"src/\n  app/\n    page.tsx"}
                  />
                ) : (
                  <div className="mt-4">
                    <TreeRows nodes={displayed.root} />
                  </div>
                )}

                <p className="mt-4 border-t border-line pt-3 text-[10px] text-ink-muted">
                  Suggested structure only. No files have been created.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-[14px] font-semibold text-ink">
                    Structure summary
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
                    This layout is derived from the approved requirements,
                    database and API. It keeps feature logic together and gives
                    every entity and endpoint a clear home.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Folders</span>
                      <span className="font-mono text-ink">{counts.folders}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Files</span>
                      <span className="font-mono text-ink">{counts.files}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Approved stages</span>
                      <span className="font-mono text-ink">
                        {project?.approvedStages ?? 0}/4
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-[14px] font-semibold text-ink">
                    Before you approve
                  </p>
                  <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-ink-muted">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      Rename folders or files if your conventions differ.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      Approving completes the four-stage blueprint.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      Nothing is written to disk from this screen.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
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
