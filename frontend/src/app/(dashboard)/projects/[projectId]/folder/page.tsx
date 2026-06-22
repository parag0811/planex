"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Folder,
  File,
  Plus,
  Trash2,
  Save,
  Sparkles,
  X,
  ChevronRight,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store/store";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateFolder,
  getJobStatusThunk,
  regenerateSection,
} from "@/src/store/slices/jobSlice";

// ─── Types ───────────────────────────────────────────────────────
interface FolderNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
}

interface FolderSectionContent {
  root: FolderNode[];
}

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

// ─── Animation ───────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// ─── Utilities ───────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 11);

const EMPTY: FolderSectionContent = { root: [] };

const updateNodeInTree = (
  nodes: FolderNode[],
  id: string,
  updates: Partial<FolderNode>,
): FolderNode[] =>
  nodes.map((node) => {
    if (node.id === id) return { ...node, ...updates };
    if (node.children)
      return {
        ...node,
        children: updateNodeInTree(node.children, id, updates),
      };
    return node;
  });

const deleteNodeFromTree = (nodes: FolderNode[], id: string): FolderNode[] =>
  nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children
        ? deleteNodeFromTree(node.children, id)
        : undefined,
    }));

const addNodeToParent = (
  nodes: FolderNode[],
  parentId: string | null,
  newNode: FolderNode,
): FolderNode[] => {
  if (!parentId) return [...nodes, newNode];
  return nodes.map((node) => {
    if (node.id === parentId)
      return { ...node, children: [...(node.children || []), newNode] };
    if (node.children)
      return {
        ...node,
        children: addNodeToParent(node.children, parentId, newNode),
      };
    return node;
  });
};

// ─── Node Modal ──────────────────────────────────────────────────
function NodeModal({
  isOpen,
  onClose,
  onSave,
  node,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: FolderNode) => void;
  node?: FolderNode | null;
}) {
  const [form, setForm] = useState({
    name: node?.name || "",
    type: (node?.type || "file") as "folder" | "file",
  });

  useEffect(() => {
    setForm({ name: node?.name || "", type: node?.type || "file" });
  }, [node, isOpen]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      id: node?.id || uid(),
      name: form.name.trim(),
      type: form.type,
      children: node?.children || [],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
            aria-label="Close modal backdrop"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 border p-6"
            style={{ borderColor: BORDER, backgroundColor: BG, ...INTER }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p
                className="text-lg font-bold uppercase tracking-[0.06em] text-white"
                style={INTER_TIGHT}
              >
                {node ? "Edit" : "Add"}{" "}
                {form.type === "folder" ? "Folder" : "File"}
              </p>
              <button
                onClick={onClose}
                className="p-1 transition hover:text-white"
                style={{ color: MUTED }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...MONO, color: MUTED }}
                >
                  Name
                </p>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={form.type === "folder" ? "my-folder" : "file.ts"}
                  className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                  style={{
                    borderColor: BORDER,
                    backgroundColor: INNER_BG,
                    ...MONO,
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>

              {/* Type toggle */}
              <div>
                <p
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...MONO, color: MUTED }}
                >
                  Type
                </p>
                <div className="flex gap-2">
                  {(["folder", "file"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className="flex flex-1 items-center justify-center gap-2 border py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition"
                      style={{
                        ...MONO,
                        borderColor: form.type === t ? ACCENT : BORDER,
                        color: form.type === t ? ACCENT : MUTED,
                        backgroundColor:
                          form.type === t ? `${ACCENT}12` : "transparent",
                      }}
                    >
                      {t === "folder" ? (
                        <Folder size={12} />
                      ) : (
                        <File size={12} />
                      )}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                  style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                  className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-40"
                  style={{
                    ...MONO,
                    borderColor: ACCENT,
                    color: ACCENT,
                    backgroundColor: `${ACCENT}12`,
                  }}
                >
                  {node ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Tree Node ───────────────────────────────────────────────────
function TreeNode({
  node,
  level,
  onAddChild,
  onEdit,
  onDelete,
  expanded,
  onToggle,
  index,
}: {
  node: FolderNode;
  level: number;
  onAddChild: (parentId: string) => void;
  onEdit: (node: FolderNode) => void;
  onDelete: (nodeId: string) => void;
  expanded: Set<string>;
  onToggle: (nodeId: string) => void;
  index: number;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isFolder = node.type === "folder";

  return (
    <div>
      <motion.div
        layout
        className="group flex items-center gap-3 border-t py-3 transition"
        style={{
          borderColor: BORDER,
          paddingLeft: `${level * 20 + 12}px`,
        }}
      >
        {/* Expand chevron */}
        <button
          onClick={() => isFolder && onToggle(node.id)}
          className="flex h-4 w-4 shrink-0 items-center justify-center transition"
          style={{ color: isFolder ? MUTED : "transparent" }}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>

        {/* Icon */}
        {isFolder ? (
          <Folder size={14} className="shrink-0" style={{ color: "#f59e0b" }} />
        ) : (
          <File size={14} className="shrink-0" style={{ color: "#60a5fa" }} />
        )}

        {/* Index */}
        <span
          className="shrink-0 text-[10px] font-bold"
          style={{ ...MONO, color: BORDER }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Name */}
        <span
          className="flex-1 truncate text-sm font-semibold text-white"
          style={MONO}
        >
          {node.name}
        </span>

        {/* Type badge */}
        <span
          className="shrink-0 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{
            ...MONO,
            borderColor: isFolder ? "#f59e0b30" : "#60a5fa30",
            color: isFolder ? "#f59e0b" : "#60a5fa",
            backgroundColor: isFolder ? "#f59e0b0a" : "#60a5fa0a",
          }}
        >
          {isFolder ? "dir" : "file"}
        </span>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {isFolder && (
            <button
              onClick={() => onAddChild(node.id)}
              className="border p-1.5 transition"
              style={{
                borderColor: `${ACCENT}40`,
                color: ACCENT,
                backgroundColor: `${ACCENT}08`,
              }}
              title="Add child"
            >
              <Plus size={11} />
            </button>
          )}
          <button
            onClick={() => onEdit(node)}
            className="border p-1.5 transition hover:text-white"
            style={{ borderColor: BORDER, color: MUTED }}
            title="Edit"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="border p-1.5 transition hover:text-red-400"
            style={{
              borderColor: "rgba(239,68,68,0.2)",
              color: MUTED,
            }}
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div
              className="border-l"
              style={{
                borderColor: BORDER,
                marginLeft: `${level * 20 + 20}px`,
              }}
            >
              {node.children!.map((child, i) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  expanded={expanded}
                  onToggle={onToggle}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Preview Node ─────────────────────────────────────────────────
function PreviewNode({
  node,
  level = 0,
}: {
  node: FolderNode;
  level?: number;
}) {
  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      <div
        className="flex items-center gap-2 border-t py-2 text-sm"
        style={{ borderColor: BORDER }}
      >
        {node.type === "folder" ? (
          <Folder size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />
        ) : (
          <File size={13} style={{ color: "#60a5fa", flexShrink: 0 }} />
        )}
        <span className="text-white" style={MONO}>
          {node.name || "Untitled"}
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <div
          className="border-l"
          style={{ borderColor: BORDER, marginLeft: 6 }}
        >
          {node.children.map((child) => (
            <PreviewNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function FolderStructurePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId)
    ? rawProjectId[0]
    : rawProjectId;
  const resolvedProjectId =
    projectId && projectId !== "undefined" ? projectId : "";

  const dispatch = useDispatch<AppDispatch>();
  const jobState = useSelector((state: RootState) => state.job);
  const folderSectionState = useSelector(
    (state: RootState) => state.section.projects[resolvedProjectId]?.folder,
  );

  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [folder, setFolder] = useState<FolderSectionContent>(EMPTY);
  const [previewData, setPreviewData] = useState<FolderSectionContent | null>(
    null,
  );
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [shown, setShown] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<FolderNode | null>(null);
  const [addingToParent, setAddingToParent] = useState<string | null>(null);

  const isFetching = Boolean(folderSectionState?.fetch.loading);
  const isSaving = Boolean(folderSectionState?.save.loading);
  const isJobLoading =
    jobState.status === "pending" || jobState.status === "processing";
  const loading = isFetching || isSaving || isJobLoading;
  const sectionError =
    folderSectionState?.fetch.error ?? folderSectionState?.save.error ?? null;
  const error =
    sectionError ?? (jobState.status === "failed" ? jobState.error : null);
  const canRegenerate =
    Boolean(previewData) || hasGeneratedOnce || folder.root.length > 0 || shown;

  // Auto-dismiss status
  useEffect(() => {
    if (status) {
      const t = setTimeout(() => {
        setStatus(null);
        setStatusType(null);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [status]);

  const normalizeFolder = (payload: unknown): FolderSectionContent => {
    const source =
      payload && typeof payload === "object" && "content" in (payload as any)
        ? (payload as any).content
        : payload;
    const raw = (source ?? {}) as Partial<FolderSectionContent>;

    const mapNode = (n: any): FolderNode => ({
      id: typeof n?.id === "string" && n.id ? n.id : uid(),
      name: typeof n?.name === "string" ? n.name : "",
      type: n?.type === "folder" ? "folder" : "file",
      children: Array.isArray(n?.children) ? n.children.map(mapNode) : [],
    });

    return {
      root: Array.isArray(raw.root) ? raw.root.map(mapNode) : [],
    };
  };

  const fetchFolder = useCallback(async () => {
    if (!resolvedProjectId) return;
    try {
      const action = await dispatch(
        fetchSectionByType({ projectId: resolvedProjectId, type: "folder" }),
      ).unwrap();
      const section = action.section as unknown;
      const content = (section && (section as any).content) ?? section ?? null;
      if (content) {
        setFolder(normalizeFolder(content));
        setShown(true);
        setHasGeneratedOnce(true);
      } else {
        setFolder(EMPTY);
        setShown(false);
      }
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to fetch folder structure.");
      setStatusType("error");
    }
  }, [dispatch, resolvedProjectId]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  const handleSave = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before saving.");
      setStatusType("error");
      return;
    }
    try {
      await dispatch(
        upsertSection({
          projectId: resolvedProjectId,
          type: "folder",
          content: folder,
        }),
      ).unwrap();
      setStatus("Folder structure saved.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to save folder structure.");
      setStatusType("error");
    }
  };

  const handleGenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before generating.");
      setStatusType("error");
      return;
    }
    try {
      dispatch(clearJobState());
      await dispatch(generateFolder({ projectId: resolvedProjectId })).unwrap();
      setStatus("Folder generation queued. We are processing it now.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue folder generation.");
      setStatusType("error");
    }
  };

  const handleRegenerate = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before regenerating.");
      setStatusType("error");
      return;
    }
    try {
      dispatch(clearJobState());
      await dispatch(
        regenerateSection({ projectId: resolvedProjectId, section: "folder" }),
      ).unwrap();
      setStatus("Folder regeneration queued. We are processing it now.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue folder regeneration.");
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
      setPreviewData(normalizeFolder(jobState.result));
      setHasGeneratedOnce(true);
      setStatus("Folder generation completed. Review and accept below.");
      setStatusType("success");
    }
    dispatch(clearJobState());
  }, [dispatch, jobState.status, jobState.result]);

  useEffect(() => {
    if (jobState.status !== "failed") return;
    setStatus(jobState.error ?? "Folder generation failed.");
    setStatusType("error");
  }, [jobState.error, jobState.status]);

  const applyAI = (s: ApplySuggestion) => {
    const payload = s.payload as unknown as FolderSectionContent;
    if (payload.root) {
      setFolder(normalizeFolder(payload));
      setShown(true);
      setExpanded(new Set());
    }
  };

  const handleAcceptPreview = async () => {
    if (!previewData) return;
    setFolder(previewData);
    setShown(true);
    setExpanded(new Set());
    setPreviewData(null);
    if (resolvedProjectId) {
      try {
        await dispatch(
          upsertSection({
            projectId: resolvedProjectId,
            type: "folder",
            content: previewData,
          }),
        ).unwrap();
        setStatus("Preview accepted and saved.");
        setStatusType("success");
      } catch {
        setStatus("Preview applied. Click Save to persist.");
        setStatusType("success");
      }
    }
  };

  const handleRejectPreview = () => {
    setPreviewData(null);
    setStatus(null);
    setStatusType(null);
  };

  const openAddModal = (parentId: string | null) => {
    setAddingToParent(parentId);
    setEditingNode(null);
    setModalOpen(true);
  };

  const openEditModal = (node: FolderNode) => {
    setEditingNode(node);
    setAddingToParent(null);
    setModalOpen(true);
  };

  const saveNode = (node: FolderNode) => {
    if (editingNode) {
      setFolder((prev) => ({
        ...prev,
        root: updateNodeInTree(prev.root, editingNode.id, {
          name: node.name,
          type: node.type,
        }),
      }));
    } else {
      setFolder((prev) => ({
        ...prev,
        root: addNodeToParent(prev.root, addingToParent, node),
      }));
    }
    setModalOpen(false);
    setEditingNode(null);
    setAddingToParent(null);
  };

  const deleteNode = (nodeId: string) => {
    setFolder((prev) => ({
      ...prev,
      root: deleteNodeFromTree(prev.root, nodeId),
    }));
  };

  const toggleExpanded = (nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const totalFiles = useMemo(() => {
    const count = (nodes: FolderNode[]): number =>
      nodes.reduce(
        (acc, n) => acc + (n.type === "file" ? 1 : 0) + count(n.children || []),
        0,
      );
    return count(folder.root);
  }, [folder]);

  const totalFolders = useMemo(() => {
    const count = (nodes: FolderNode[]): number =>
      nodes.reduce(
        (acc, n) =>
          acc + (n.type === "folder" ? 1 : 0) + count(n.children || []),
        0,
      );
    return count(folder.root);
  }, [folder]);

  return (
    <div
      ref={scrollRef}
      className="relative w-full flex-1 overflow-y-auto overflow-x-hidden"
      style={{ ...INTER, backgroundColor: BG }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:px-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Top bar */}
          <motion.div
            variants={fadeUp(0)}
            className="mb-8 flex flex-wrap items-center justify-end gap-2"
          >
            <button
              onClick={fetchFolder}
              disabled={isFetching}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-50"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              <RefreshCw size={12} />
              {isFetching ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-50"
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

          {/* Loading bar */}
          {loading && (
            <div
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
                className="h-4 w-4 rounded-full border-2"
                style={{
                  borderColor: ACCENT,
                  borderTopColor: "transparent",
                }}
              />
              <p
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ ...MONO, color: ACCENT }}
              >
                {isJobLoading
                  ? "Generating folder structure"
                  : isSaving
                    ? "Saving folder structure"
                    : "Loading folder structure"}
              </p>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-start gap-3 border p-4"
                style={{
                  borderColor: "rgba(239,68,68,0.3)",
                  backgroundColor: "rgba(239,68,68,0.08)",
                }}
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-500"
                />
                <div className="flex-1">
                  <p
                    className="font-semibold text-red-400 text-sm"
                    style={INTER}
                  >
                    Error
                  </p>
                  <p className="mt-1 text-sm text-red-400/75" style={INTER}>
                    {error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status */}
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="mb-6 flex items-center gap-3 border px-4 py-3"
                style={{
                  borderColor:
                    statusType === "success"
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(245,158,11,0.3)",
                  backgroundColor:
                    statusType === "success"
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(245,158,11,0.08)",
                }}
              >
                {statusType === "success" ? (
                  <CheckCircle
                    size={16}
                    className="text-emerald-500 shrink-0"
                  />
                ) : (
                  <Zap size={16} className="text-amber-500 shrink-0" />
                )}
                <p
                  className="text-sm font-medium"
                  style={{
                    ...INTER,
                    color: statusType === "success" ? "#34d399" : "#fbbf24",
                  }}
                >
                  {status}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breadcrumb */}
          <motion.div variants={fadeUp(1)} className="mb-3">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ ...MONO, color: ACCENT }}
            >
              Section // 02 / Architecture
            </p>
          </motion.div>

          {/* Giant headline */}
          <motion.div variants={fadeUp(2)} className="mb-6">
            <h1
              className="text-[3.4rem] sm:text-[4.2rem] md:text-[5rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
              style={INTER_TIGHT}
            >
              Folder
              <br />
              Structure
            </h1>
          </motion.div>

          {/* Tag pills */}
          <motion.div
            variants={fadeUp(3)}
            className="mb-10 flex flex-wrap items-center gap-3"
          >
            <span
              className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              Ver: {folder.root.length > 0 ? "1.0.0" : "0.0.0"}
            </span>
            <span
              className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              {folder.root.length > 0 ? "Active_Tree" : "Empty_State_Core"}
            </span>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp(4)}
            className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {[
              {
                label: "Root Nodes",
                value: folder.root.length,
              },
              {
                label: "Total Folders",
                value: totalFolders,
              },
              {
                label: "Total Files",
                value: totalFiles,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="border p-5"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <p
                  className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ ...MONO, color: MUTED }}
                >
                  {card.label}
                </p>
                <p className="text-base font-semibold text-white" style={INTER}>
                  {card.value}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Section header */}
          <motion.div
            variants={fadeUp(5)}
            className="mb-4 flex items-center gap-3"
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0"
              style={{ ...MONO, color: MUTED }}
            >
              Project Layout
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          </motion.div>

          {/* Generate / Regenerate */}
          <motion.div variants={fadeUp(6)} className="mb-8">
            {canRegenerate ? (
              <button
                onClick={handleRegenerate}
                disabled={isJobLoading}
                className="flex cursor-pointer items-center gap-2 border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  ...MONO,
                  borderColor: "#60a5fa55",
                  color: "#60a5fa",
                  backgroundColor: "#60a5fa12",
                }}
              >
                <Sparkles size={15} />
                {isJobLoading ? "Regenerating..." : "Regenerate Suggestions"}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isJobLoading}
                className="flex cursor-pointer items-center gap-2 border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Sparkles size={15} />
                {isJobLoading ? "Generating..." : "Generate Suggestions"}
              </button>
            )}
          </motion.div>

          {/* Tree view */}
          <motion.div variants={fadeUp(7)} className="mb-12">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white" style={INTER_TIGHT}>
                File Tree
              </h2>
              <button
                onClick={() => openAddModal(null)}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Plus size={13} />
                Add Root
              </button>
            </div>

            <div
              className="border"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              {folder.root.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center border"
                    style={{ borderColor: BORDER }}
                  >
                    <Folder size={22} style={{ color: MUTED }} />
                  </div>
                  <div>
                    <p
                      className="text-base font-semibold text-white"
                      style={INTER}
                    >
                      No structure yet
                    </p>
                    <p
                      className="mt-1 text-sm"
                      style={{ ...INTER, color: MUTED }}
                    >
                      Click "Add Root" or use "Generate Suggestions" to get
                      started.
                    </p>
                  </div>
                  <button
                    onClick={() => openAddModal(null)}
                    className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                    style={{
                      ...MONO,
                      borderColor: ACCENT,
                      color: ACCENT,
                      backgroundColor: `${ACCENT}12`,
                    }}
                  >
                    <Plus size={13} />
                    Add Root Node
                  </button>
                </div>
              ) : (
                <div>
                  {/* Column header */}
                  <div
                    className="flex items-center gap-3 border-b px-3 py-2"
                    style={{ borderColor: BORDER }}
                  >
                    <span
                      className="w-4 shrink-0"
                      style={{ color: "transparent" }}
                    />
                    <span
                      className="w-4 shrink-0"
                      style={{ color: "transparent" }}
                    />
                    <span
                      className="w-6 shrink-0 text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: BORDER }}
                    >
                      #
                    </span>
                    <span
                      className="flex-1 text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Name
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Type
                    </span>
                    <span
                      className="w-24 shrink-0"
                      style={{ color: "transparent" }}
                    />
                  </div>

                  {folder.root.map((node, i) => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      level={0}
                      onAddChild={openAddModal}
                      onEdit={openEditModal}
                      onDelete={deleteNode}
                      expanded={expanded}
                      onToggle={toggleExpanded}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AIRightSidebar
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
        onApplySuggestion={applyAI}
        projectDescription="Design your project folder structure with organized directories and files."
      />

      {/* Node Modal */}
      <NodeModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNode(null);
          setAddingToParent(null);
        }}
        onSave={saveNode}
        node={editingNode}
      />

      {/* Preview Modal */}
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
              className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-6"
              style={{
                borderColor: BORDER,
                backgroundColor: BG,
                ...INTER,
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p
                  className="text-lg font-bold uppercase tracking-[0.06em] text-white"
                  style={INTER_TIGHT}
                >
                  Preview Generated Structure
                </p>
                <button
                  onClick={handleRejectPreview}
                  className="p-1 transition hover:text-white"
                  style={{ color: MUTED }}
                >
                  <X size={16} />
                </button>
              </div>

              <div
                className="border p-4"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                {(previewData.root ?? []).length > 0 ? (
                  (previewData.root ?? []).map((node) => (
                    <PreviewNode key={node.id} node={node} />
                  ))
                ) : (
                  <p className="text-sm" style={{ ...INTER, color: MUTED }}>
                    The generated preview is empty.
                  </p>
                )}
              </div>

              <div
                className="mt-8 flex justify-end gap-3 border-t pt-6"
                style={{ borderColor: BORDER }}
              >
                <button
                  onClick={handleRegenerate}
                  disabled={isJobLoading}
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
                  className="flex items-center gap-2 border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                  style={{
                    ...MONO,
                    borderColor: "#22c55e55",
                    color: "#22c55e",
                    backgroundColor: "#22c55e12",
                  }}
                >
                  Accept & Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
