"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Folder,
  File,
  Plus,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Edit2,
} from "lucide-react";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store/store";
import { fetchSectionByType, upsertSection } from "@/src/store/slices/sectionSlice";

interface FolderNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
}

interface FolderSectionContent {
  root: FolderNode[];
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const uid = () => Math.random().toString(36).slice(2, 11);

const EMPTY: FolderSectionContent = { root: [] };

const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// Utility to find node by id
const findNodeById = (nodes: FolderNode[], id: string): FolderNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Utility to update node in tree
const updateNodeInTree = (
  nodes: FolderNode[],
  id: string,
  updates: Partial<FolderNode>
): FolderNode[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, id, updates) };
    }
    return node;
  });
};

// Utility to delete node from tree
const deleteNodeFromTree = (nodes: FolderNode[], id: string): FolderNode[] => {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children ? deleteNodeFromTree(node.children, id) : undefined,
    }));
};

// Utility to add node to parent
const addNodeToParent = (
  nodes: FolderNode[],
  parentId: string | null,
  newNode: FolderNode
): FolderNode[] => {
  if (!parentId) {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), newNode] };
    }
    if (node.children) {
      return { ...node, children: addNodeToParent(node.children, parentId, newNode) };
    }
    return node;
  });
};

// Modal for adding/editing nodes
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
  const [form, setForm] = useState({ name: node?.name || "", type: (node?.type || "file") as "folder" | "file" });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      id: node?.id || uid(),
      name: form.name,
      type: form.type,
      children: node?.children || [],
    });
    setForm({ name: "", type: "file" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-xl border border-white/8 bg-[#0b1019] p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {node ? "Edit" : "Add"} {form.type === "folder" ? "Folder" : "File"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-white/35 transition hover:bg-white/8 hover:text-white/55"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={form.type === "folder" ? "my-folder" : "file.ts"}
                    className="w-full rounded-md border border-white/8 bg-[#0f1520] px-4 py-3 font-mono text-sm text-white/80 placeholder:text-white/20 outline-none transition hover:border-white/12 focus:border-orange-500/30 focus:bg-[#141a26]"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.12em] text-white/40">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {(["folder", "file"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex-1 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${
                          form.type === t
                            ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                            : "border-white/8 bg-white/3 text-white/45 hover:border-white/12"
                        }`}
                      >
                        {t === "folder" ? <Folder size={12} className="inline mr-1" /> : <File size={12} className="inline mr-1" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-md border border-white/8 bg-white/3 px-4 py-2 text-sm font-bold text-white/60 transition hover:border-white/12 hover:text-white/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.name.trim()}
                    className="flex-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400 transition hover:border-orange-500/50 hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {node ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Tree node renderer
function TreeNode({
  node,
  level,
  onAddChild,
  onEdit,
  onDelete,
  expanded,
  onToggle,
}: {
  node: FolderNode;
  level: number;
  onAddChild: (parentId: string) => void;
  onEdit: (node: FolderNode) => void;
  onDelete: (nodeId: string) => void;
  expanded: Set<string>;
  onToggle: (nodeId: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <div key={node.id} className="flex flex-col">
      <motion.div
        layout
        className="group flex items-center gap-2 rounded-md py-2 px-3 hover:bg-white/4 transition"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {node.type === "folder" && (
          <button
            onClick={() => onToggle(node.id)}
            className="flex items-center justify-center w-5 h-5 text-white/35 hover:text-white/55 transition"
          >
            <ChevronRight
              size={16}
              className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
        {node.type === "folder" ? (
          <Folder size={14} className="text-amber-400/70 shrink-0" />
        ) : (
          <File size={14} className="text-blue-400/70 shrink-0" />
        )}
        <span className="flex-1 text-sm text-white/75 truncate">{node.name}</span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.type === "folder" && (
            <button
              onClick={() => onAddChild(node.id)}
              className="rounded p-1 text-white/35 hover:bg-white/8 hover:text-white/70 transition"
              title="Add child"
            >
              <Plus size={12} />
            </button>
          )}
          <button
            onClick={() => onEdit(node)}
            className="rounded p-1 text-white/35 hover:bg-white/8 hover:text-white/70 transition"
            title="Edit"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="rounded p-1 text-white/35 hover:bg-red-500/20 hover:text-red-400 transition"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </motion.div>

      {hasChildren && isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col"
        >
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function FolderStructurePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const resolvedProjectId = projectId && projectId !== "undefined" ? projectId : "";

  const dispatch = useDispatch<AppDispatch>();
  const folderSectionState = useSelector(
    (state: RootState) => state.section.projects[resolvedProjectId]?.folder,
  );

  const [status, setStatus] = useState<string | null>(null);
  const [folder, setFolder] = useState<FolderSectionContent>(EMPTY);
  const [shown, setShown] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<FolderNode | null>(null);
  const [addingToParent, setAddingToParent] = useState<string | null>(null);

  const show = () => {
    setShown(true);
    setExpanded(new Set());
    setStatus("Folder builder opened.");
  };

  const reset = () => {
    setFolder(EMPTY);
    setShown(false);
  };

  const save = () => {
    handleSaveDraft();
  };

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
    setStatus(null);
    try {
      const action = await dispatch(
        fetchSectionByType({ projectId: resolvedProjectId, type: "folder" }),
      ).unwrap();

      const section = action.section as unknown;
      const content = (section && (section as any).content) ?? section ?? null;
      if (content) {
        setFolder(normalizeFolder(content));
        setShown(true);
      } else {
        setFolder(EMPTY);
        setShown(false);
      }
    } catch (err: any) {
      setStatus(typeof err === "string" ? err : err?.message ?? "Failed to fetch folder");
    }
  }, [dispatch, resolvedProjectId]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  const handleSaveDraft = async () => {
    if (!resolvedProjectId) return;
    setStatus(null);
    try {
      await dispatch(
        upsertSection({ projectId: resolvedProjectId, type: "folder", content: folder }),
      ).unwrap();
      setStatus("Saved");
    } catch (err: any) {
      setStatus(typeof err === "string" ? err : err?.message ?? "Failed to save folder");
    }
  };

  const isFetching = Boolean(folderSectionState?.fetch.loading);
  const isSaving = Boolean(folderSectionState?.save.loading);
  const loading = isFetching || isSaving;
  const error = folderSectionState?.fetch.error ?? folderSectionState?.save.error ?? null;

  const applyAI = (s: ApplySuggestion) => {
    const payload = s.payload as unknown as FolderSectionContent;
    if (payload.root) {
      setFolder(normalizeFolder(payload));
      setShown(true);
      setExpanded(new Set());
    }
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
      // Edit existing node
      setFolder((prev) => ({
        ...prev,
        root: updateNodeInTree(prev.root, editingNode.id, {
          name: node.name,
          type: node.type,
        }),
      }));
    } else {
      // Add new node
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
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#05070d]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          aiOpen ? "lg:pr-85" : "lg:pr-0"
        }`}
      >
        {/* Header */}
        <div className="border-b border-white/8 bg-[#0b1019]/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <Folder size={20} className="text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Folder Structure</h1>
              <p className="text-xs text-white/40">Design your project layout</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFolder(EMPTY)}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/6 hover:text-white/80 hover:border-white/12"
            >
              <X size={14} />
              Clear
            </button>
            <button
              onClick={show}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/6 hover:text-white/80 hover:border-white/12"
            >
              <Folder size={14} />
              Open Builder
            </button>
            <button
              onClick={fetchFolder}
              disabled={isFetching}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/6 hover:text-white/80 hover:border-white/12 disabled:opacity-50"
            >
              <X size={14} />
              {isFetching ? "Fetching..." : "Refresh"}
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400 transition hover:border-orange-500/50 hover:bg-orange-500/20 disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="border-b border-red-500/20 bg-red-500/5 px-6 py-3 text-xs font-mono text-red-400">
            {error}
          </div>
        )}
        {status && !error && (
          <div className="border-b border-green-500/20 bg-green-500/5 px-6 py-3 text-xs font-mono text-green-400">
            {status}
          </div>
        )}
        {loading && (
          <div className="border-b border-blue-500/20 bg-blue-500/5 px-6 py-3 text-xs font-mono text-blue-400">
            {isFetching ? "Loading folder structure..." : "Saving folder structure..."}
          </div>
        )}

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 flex flex-col gap-4"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-1"
          >
            {!shown ? (
              <motion.div variants={fadeUp(0)} className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-lg bg-white/3 flex items-center justify-center">
                    <Folder size={24} className="text-white/20" />
                  </div>
                  <p className="text-sm font-bold text-white/40">No folder structure yet</p>
                  <p className="text-xs text-white/25 max-w-xs">
                    Open the builder or start adding folders manually.
                  </p>
                  <button
                    onClick={() => openAddModal(null)}
                    className="mt-2 flex items-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-400 transition hover:border-orange-500/50 hover:bg-orange-500/20"
                  >
                    <Plus size={12} />
                    Add Root Folder
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div variants={fadeUp(0)} className="flex gap-2 mb-2">
                  <button
                    onClick={() => openAddModal(null)}
                    className="flex items-center gap-1 rounded-md border border-white/8 bg-white/4 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/6 hover:text-white/80"
                  >
                    <Plus size={12} />
                    Add Root
                  </button>
                </motion.div>

                <motion.div
                  variants={fadeUp(1)}
                  className="rounded-lg border border-white/8 bg-[#0f1520]/50 p-4 flex-1 overflow-y-auto min-h-96"
                >
                  <div className="space-y-1">
                    {folder.root.length === 0 ? (
                      <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-white/10 text-center">
                        <div className="w-10 h-10 rounded-lg bg-white/3 flex items-center justify-center">
                          <Folder size={20} className="text-white/20" />
                        </div>
                        <div>
                          <p className="text-xs text-white/30">No items yet.</p>
                          <p className="mt-1 text-[11px] text-white/20">
                            Start adding folders or files manually.
                          </p>
                        </div>
                        <button
                          onClick={() => openAddModal(null)}
                          className="flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-bold text-orange-400 transition hover:border-orange-500/50 hover:bg-orange-500/20"
                        >
                          <Plus size={12} />
                          Add Root Folder
                        </button>
                      </div>
                    ) : (
                      folder.root.map((node) => (
                        <TreeNode
                          key={node.id}
                          node={node}
                          level={0}
                          onAddChild={openAddModal}
                          onEdit={openEditModal}
                          onDelete={deleteNode}
                          expanded={expanded}
                          onToggle={toggleExpanded}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* AI Sidebar */}
      <AIRightSidebar
        onApplySuggestion={applyAI}
        projectDescription="Design your project folder structure with organized directories and files."
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
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
    </div>
  );
}
