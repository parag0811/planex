"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Copy,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  addFolderNode,
  countFolderNodes,
  EMPTY_FOLDER,
  getFolderChildren,
  normalizeFolder,
  removeFolderNode,
  renameFolderNode,
  serializeFolder,
  uniqueFolderName,
  type FolderContent,
  type FolderNode,
} from "@/src/lib/folder-content";
import {
  FolderEditorSchema,
  getFolderFieldErrors,
} from "@/src/lib/schemas/folder.schema";
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

function TreeEditor({
  nodes,
  fieldErrors,
  onRename,
  onAdd,
  onRemove,
  path = [],
  errorPrefix = "root",
  depth = 0,
}: {
  nodes: FolderNode[];
  fieldErrors: Record<string, string>;
  onRename: (path: number[], name: string) => void;
  onAdd: (parentPath: number[], type: FolderNode["type"]) => void;
  onRemove: (path: number[]) => void;
  path?: number[];
  errorPrefix?: string;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const nodePath = [...path, index];
        const nodeKey = `${errorPrefix}.${index}`;
        const nameError = fieldErrors[`${nodeKey}.name`];
        const childrenError = fieldErrors[`${nodeKey}.children`];

        return (
          <div key={nodePath.join(".")}>
            <div
              className="flex flex-wrap items-start gap-2 rounded-md px-2 py-1.5 hover:bg-surface-muted/60"
              style={{ marginLeft: `${depth * 20}px` }}
            >
              <span className="pt-2">
                {node.type === "folder" ? (
                  <Folder size={14} className="text-brand" />
                ) : (
                  <FileText size={14} className="text-ink-muted" />
                )}
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  value={node.name}
                  onChange={(event) => onRename(nodePath, event.target.value)}
                  aria-label={`${node.type === "folder" ? "Folder" : "File"} name`}
                  invalid={Boolean(nameError)}
                  className="h-8 font-mono text-[11px]"
                />
                <InlineError message={nameError} />
              </div>

              <Badge tone={node.type === "folder" ? "brand" : "neutral"}>
                {node.type === "folder" ? "Folder" : "File"}
              </Badge>

              {node.type === "folder" ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<FilePlus size={13} />}
                    onClick={() => onAdd(nodePath, "file")}
                    aria-label={`Add file inside ${node.name || "folder"}`}
                  >
                    Add file
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<FolderPlus size={13} />}
                    onClick={() => onAdd(nodePath, "folder")}
                    aria-label={`Add folder inside ${node.name || "folder"}`}
                  >
                    Add folder
                  </Button>
                </div>
              ) : null}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(nodePath)}
                aria-label={`Remove ${node.name || node.type}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>

            {childrenError ? (
              <div style={{ marginLeft: `${depth * 20 + 24}px` }}>
                <InlineError message={childrenError} />
              </div>
            ) : null}

            {node.children && node.children.length > 0 ? (
              <TreeEditor
                nodes={node.children}
                fieldErrors={fieldErrors}
                onRename={onRename}
                onAdd={onAdd}
                onRemove={onRemove}
                path={nodePath}
                errorPrefix={`${nodeKey}.children`}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
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

  const validation = useMemo(
    () => FolderEditorSchema.safeParse(content),
    [content],
  );
  const previewValidation = useMemo(
    () => (preview ? FolderEditorSchema.safeParse(preview) : null),
    [preview],
  );

  const fieldErrors = validation.success
    ? {}
    : getFolderFieldErrors(validation.error);
  const previewErrors =
    previewValidation && !previewValidation.success
      ? getFolderFieldErrors(previewValidation.error)
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
      ? "Blueprint complete"
      : "Approve to complete your blueprint";
  const stageBadge = preview
    ? { label: "AI draft", tone: "warning" as const }
    : isEditing
      ? { label: "Draft · Not saved", tone: "warning" as const }
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

    const source = preview ?? content;
    const result = FolderEditorSchema.safeParse(source);

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

  const addNode = (parentPath: number[], type: FolderNode["type"]) => {
    setContent((prev) => {
      const siblings = getFolderChildren(prev.root, parentPath);
      const name = uniqueFolderName(
        siblings,
        type === "folder" ? "new-folder" : "new-file",
      );

      return {
        ...prev,
        root: addFolderNode(prev.root, parentPath, {
          name,
          type,
          ...(type === "folder" ? { children: [] } : {}),
        }),
      };
    });
  };

  const renameNode = (path: number[], name: string) => {
    setContent((prev) => ({
      ...prev,
      root: renameFolderNode(prev.root, path, name),
    }));
  };

  const removeNode = (path: number[]) => {
    setContent((prev) => ({
      ...prev,
      root: removeFolderNode(prev.root, path),
    }));
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

  if (displayed.root.length === 0 && !jobActive && !isEditing) {
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
              {isEditing
                ? "Editing the tree. Add, rename or remove files and folders, then approve to save."
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
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
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <Folder size={14} className="text-brand" />
                        <span className="font-mono text-[11px] text-ink">
                          Project root
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<FilePlus size={13} />}
                          onClick={() => addNode([], "file")}
                        >
                          Add file
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<FolderPlus size={13} />}
                          onClick={() => addNode([], "folder")}
                        >
                          Add folder
                        </Button>
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                      Add to the root here, or use Add file / Add folder on any
                      folder row to add inside it.
                    </p>

                    <InlineError message={fieldErrors.root} />

                    {displayed.root.length === 0 ? (
                      <div className="mt-3 rounded-lg border border-dashed border-line p-6 text-center text-[12px] text-ink-muted">
                        No files or folders yet. Use Add file or Add folder
                        above.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-1">
                        <TreeEditor
                          nodes={displayed.root}
                          fieldErrors={fieldErrors}
                          onRename={renameNode}
                          onAdd={addNode}
                          onRemove={removeNode}
                        />
                      </div>
                    )}
                  </div>
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
                      Add, rename or remove files and folders to match your
                      conventions.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      Use Add file or Add folder on a folder row to add inside
                      it.
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
        canApprove={dirty && canSave}
        editing={isEditing}
      />
    </div>
  );
}
