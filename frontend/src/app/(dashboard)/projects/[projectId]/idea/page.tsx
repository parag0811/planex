"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type FormEvent,
} from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Zap,
  Database,
  Globe,
  Server,
  Cpu,
  Sparkles,
  Layers,
  Circle,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  X,
  Check,
} from "lucide-react";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateIdea,
  getJobStatusThunk,
  regenerateSection,
} from "@/src/store/slices/jobSlice";
import type { AppDispatch, RootState } from "@/src/store/store";
import AIRightSidebar, {
  type ApplySuggestion,
} from "@/src/components/layout/project-section/AIRightSidebar";

type FeaturePriority = "must_have" | "nice_to_have";

type StackCategory =
  | "frontend"
  | "backend"
  | "database"
  | "infrastructure"
  | "ai"
  | "frameworks";

interface KeyFeature {
  name: string;
  description: string;
  priority: FeaturePriority;
}

interface IdeaSectionContent {
  raw_idea: string;
  overview: string;
  key_features: KeyFeature[];
  requirements: string[];
  suggested_tech_stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure?: string[];
    ai?: string[];
    frameworks?: string[];
  };
  estimated_complexity: "low" | "medium" | "high";
  team_size: string;
}

interface SectionPayload {
  content?: unknown;
}

type ModalType = "feature" | "requirement" | "tech" | null;

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
const SERIF: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
};

const PRIORITY_COLORS: Record<FeaturePriority, string> = {
  must_have: "#d84c28",
  nice_to_have: "#737373",
};

const PRIORITY_LABELS: Record<FeaturePriority, string> = {
  must_have: "Critical",
  nice_to_have: "Optional",
};

const STACK_ICONS: Record<StackCategory, ElementType> = {
  frontend: Globe,
  backend: Server,
  database: Database,
  infrastructure: Cpu,
  ai: Sparkles,
  frameworks: Layers,
};

const STACK_COLORS: Record<StackCategory, string> = {
  frontend: "#60a5fa",
  backend: "#d84c28",
  database: "#a78bfa",
  infrastructure: "#22c55e",
  ai: "#f59e0b",
  frameworks: "#e879f9",
};

const STACK_KEYS: StackCategory[] = [
  "frontend",
  "backend",
  "database",
  "infrastructure",
  "ai",
  "frameworks",
];

const EMPTY_IDEA: IdeaSectionContent = {
  raw_idea: "",
  overview: "",
  key_features: [],
  requirements: [],
  suggested_tech_stack: {
    frontend: [],
    backend: [],
    database: [],
    infrastructure: [],
    ai: [],
    frameworks: [],
  },
  estimated_complexity: "medium",
  team_size: "",
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const normalizeIdea = (payload: unknown): IdeaSectionContent => {
  const source =
    payload &&
    typeof payload === "object" &&
    "content" in (payload as SectionPayload) &&
    (payload as SectionPayload).content &&
    typeof (payload as SectionPayload).content === "object"
      ? (payload as SectionPayload).content
      : payload;

  const raw = (source ?? {}) as Partial<IdeaSectionContent>;
  const stackRaw = (raw.suggested_tech_stack ?? {}) as Partial<
    IdeaSectionContent["suggested_tech_stack"]
  >;

  const normalizedFeatures = Array.isArray(raw.key_features)
    ? raw.key_features
        .map((feature) => ({
          name: typeof feature?.name === "string" ? feature.name.trim() : "",
          description:
            typeof feature?.description === "string"
              ? feature.description.trim()
              : "",
          priority: (feature?.priority === "must_have"
            ? "must_have"
            : "nice_to_have") as FeaturePriority,
        }))
        .filter((feature) => feature.name || feature.description)
    : [];

  const complexity =
    raw.estimated_complexity === "low" ||
    raw.estimated_complexity === "medium" ||
    raw.estimated_complexity === "high"
      ? raw.estimated_complexity
      : "medium";

  return {
    raw_idea: typeof raw.raw_idea === "string" ? raw.raw_idea : "",
    overview: typeof raw.overview === "string" ? raw.overview : "",
    key_features: normalizedFeatures,
    requirements: asStringArray(raw.requirements),
    suggested_tech_stack: {
      frontend: asStringArray(stackRaw.frontend),
      backend: asStringArray(stackRaw.backend),
      database: asStringArray(stackRaw.database),
      infrastructure: asStringArray(stackRaw.infrastructure),
      ai: asStringArray(stackRaw.ai),
      frameworks: asStringArray(stackRaw.frameworks),
    },
    estimated_complexity: complexity,
    team_size: typeof raw.team_size === "string" ? raw.team_size : "",
  };
};

export default function IdeaPage() {
  const params = useParams();
  const rawProjectId = params?.projectId;
  const projectId = Array.isArray(rawProjectId)
    ? rawProjectId[0]
    : rawProjectId;
  const resolvedProjectId =
    projectId && projectId !== "undefined" ? projectId : "";
  const dispatch = useDispatch<AppDispatch>();
  const jobState = useSelector((state: RootState) => state.job);
  const ideaSectionState = useSelector(
    (state: RootState) => state.section.projects[resolvedProjectId]?.idea,
  );

  const [ideaData, setIdeaData] = useState<IdeaSectionContent>(EMPTY_IDEA);
  const [aiOpen, setAiOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [previewData, setPreviewData] = useState<IdeaSectionContent | null>(
    null,
  );
  const [acceptingPreview, setAcceptingPreview] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [featureForm, setFeatureForm] = useState<KeyFeature>({
    name: "",
    description: "",
    priority: "nice_to_have",
  });
  const [requirementForm, setRequirementForm] = useState("");
  const [techForm, setTechForm] = useState<{
    category: StackCategory;
    value: string;
  }>({
    category: "frontend",
    value: "",
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasAnyContent = useMemo(
    () =>
      Boolean(ideaData.raw_idea.trim()) ||
      Boolean(ideaData.overview.trim()) ||
      ideaData.key_features.length > 0 ||
      ideaData.requirements.length > 0 ||
      STACK_KEYS.some(
        (key) => (ideaData.suggested_tech_stack[key] ?? []).length > 0,
      ),
    [ideaData],
  );

  const hasEditableContent = useMemo(
    () =>
      Boolean(ideaData.raw_idea.trim()) ||
      Boolean(ideaData.overview.trim()) ||
      ideaData.key_features.some(
        (feature) => feature.name.trim() || feature.description.trim(),
      ) ||
      ideaData.requirements.some((requirement) => requirement.trim()) ||
      STACK_KEYS.some(
        (key) => (ideaData.suggested_tech_stack[key] ?? []).length > 0,
      ) ||
      Boolean(ideaData.team_size.trim()) ||
      ideaData.estimated_complexity !== "medium",
    [ideaData],
  );

  const canRegenerate = hasAnyContent || Boolean(previewData);

  const isFetching = Boolean(ideaSectionState?.fetch.loading);
  const isSaving = Boolean(ideaSectionState?.save.loading);
  const isJobLoading =
    jobState.status === "pending" || jobState.status === "processing";
  const loading = isFetching || isSaving || isJobLoading;
  const sectionError =
    ideaSectionState?.fetch.error ?? ideaSectionState?.save.error ?? null;
  const error =
    sectionError ?? (jobState.status === "failed" ? jobState.error : null);

  const fetchIdea = useCallback(async () => {
    if (!resolvedProjectId) {
      setIdeaData(EMPTY_IDEA);
      return;
    }

    try {
      const result = await dispatch(
        fetchSectionByType({ projectId: resolvedProjectId, type: "idea" }),
      ).unwrap();
      setIdeaData(normalizeIdea(result.section));
      if (result.section?.content) {
        setHasGeneratedOnce(true);
      }
    } catch (err: any) {
      setIdeaData(EMPTY_IDEA);
    }
  }, [dispatch, resolvedProjectId]);

  useEffect(() => {
    fetchIdea();
  }, [fetchIdea]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus(null);
        setStatusType(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const root = document.scrollingElement ?? document.documentElement;
    const previous = root.scrollTop;

    window.scrollTo(0, 0);
    root.scrollTop = 0;
    scrollRef.current?.scrollTo(0, 0);

    return () => {
      history.scrollRestoration = "auto";
      root.scrollTop = previous;
    };
  }, [resolvedProjectId]);

  const handleApplySuggestion = (suggestion: ApplySuggestion) => {
    setIdeaData((current) =>
      normalizeIdea({ ...current, ...suggestion.payload }),
    );
    setStatus("Applied suggestion locally.");
    setStatusType("success");
  };

  const handleGenerate = async (forceRegenerate = false) => {
    if (!ideaData.raw_idea.trim()) {
      setStatus("Add a raw idea first to generate suggestions.");
      setStatusType("error");
      return;
    }

    if (!resolvedProjectId) {
      setStatus("Select a project before generating idea suggestions.");
      setStatusType("error");
      return;
    }

    try {
      dispatch(clearJobState());

      await dispatch(
        generateIdea({
          projectId: resolvedProjectId,
          idea: ideaData.raw_idea,
          forceRegenerate,
        }),
      ).unwrap();

      setStatus(
        forceRegenerate
          ? "Idea regeneration queued. We are processing it now."
          : "Idea generation queued. We are processing it now.",
      );
      setStatusType("success");
    } catch (err: any) {
      setStatus(
        err?.message ??
          (forceRegenerate
            ? "Failed to queue idea regeneration."
            : "Failed to queue idea generation."),
      );
      setStatusType("error");
    }
  };

  const handleRegenerate = async () => {
    if (!ideaData.raw_idea.trim()) {
      setStatus("Add a raw idea first to regenerate suggestions.");
      setStatusType("error");
      return;
    }

    if (!resolvedProjectId) {
      setStatus("Select a project before regenerating idea suggestions.");
      setStatusType("error");
      return;
    }

    try {
      dispatch(clearJobState());

      await dispatch(
        regenerateSection({
          projectId: resolvedProjectId,
          section: "idea",
        }),
      ).unwrap();

      setStatus("Idea regeneration queued. We are processing it now.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue idea regeneration.");
      setStatusType("error");
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

    if (jobState.result?.idea) {
      const generatedIdea = normalizeIdea(jobState.result.idea);
      setPreviewData(generatedIdea);
      setHasGeneratedOnce(true);
      setStatus("Idea generation completed. Review and accept below.");
      setStatusType("success");
    }

    dispatch(clearJobState());
  }, [dispatch, jobState.status, jobState.result]);

  useEffect(() => {
    if (jobState.status !== "failed") {
      return;
    }

    setStatus(jobState.error || "Idea generation failed.");
    setStatusType("error");
  }, [jobState.error, jobState.status]);

  const handleManualSave = async () => {
    if (!resolvedProjectId) {
      setStatus("Select a project before saving the idea section.");
      return;
    }

    if (!hasEditableContent) {
      setStatus("Add at least one field before saving the idea section.");
      return;
    }

    try {
      const result = await dispatch(
        upsertSection({
          projectId: resolvedProjectId,
          type: "idea",
          content: ideaData,
        }),
      ).unwrap();

      setIdeaData(normalizeIdea(result.section));
      setStatus("Idea section saved.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message || "Failed to save idea section.");
      setStatusType("error");
    }
  };

  const handleAcceptPreview = async () => {
    if (!resolvedProjectId || !previewData) {
      return;
    }

    setAcceptingPreview(true);
    try {
      setIdeaData(previewData);
      setPreviewData(null);

      const result = await dispatch(
        upsertSection({
          projectId: resolvedProjectId,
          type: "idea",
          content: previewData,
        }),
      ).unwrap();

      setIdeaData(normalizeIdea(result.section));
      setStatus("Idea preview accepted and saved successfully.");
      setStatusType("success");
    } catch (err: any) {
      setIdeaData(previewData);
      setPreviewData(null);
      setStatus("Preview filled. Click Save button to save to database.");
      setStatusType("success");
    } finally {
      setAcceptingPreview(false);
    }
  };

  const handleRejectPreview = () => {
    setPreviewData(null);
    setStatus(null);
    setStatusType(null);
  };

  const openFeatureModal = () => {
    setFeatureForm({ name: "", description: "", priority: "nice_to_have" });
    setActiveModal("feature");
  };

  const openRequirementModal = () => {
    setRequirementForm("");
    setActiveModal("requirement");
  };

  const openTechModal = () => {
    setTechForm({ category: "frontend", value: "" });
    setActiveModal("tech");
  };

  const addFeature = (e: FormEvent) => {
    e.preventDefault();
    if (!featureForm.name.trim() || !featureForm.description.trim()) {
      return;
    }

    setIdeaData((current) => ({
      ...current,
      key_features: [
        ...current.key_features,
        {
          name: featureForm.name.trim(),
          description: featureForm.description.trim(),
          priority: featureForm.priority,
        },
      ],
    }));
    setActiveModal(null);
  };

  const addRequirement = (e: FormEvent) => {
    e.preventDefault();
    if (!requirementForm.trim()) {
      return;
    }

    setIdeaData((current) => ({
      ...current,
      requirements: [...current.requirements, requirementForm.trim()],
    }));
    setActiveModal(null);
  };

  const addTechItem = (e: FormEvent) => {
    e.preventDefault();
    if (!techForm.value.trim()) {
      return;
    }

    setIdeaData((current) => ({
      ...current,
      suggested_tech_stack: {
        ...current.suggested_tech_stack,
        [techForm.category]: [
          ...(current.suggested_tech_stack[techForm.category] ?? []),
          techForm.value.trim(),
        ],
      },
    }));
    setActiveModal(null);
  };

  const removeFeature = (index: number) => {
    setIdeaData((current) => ({
      ...current,
      key_features: current.key_features.filter((_, idx) => idx !== index),
    }));
  };

  const removeRequirement = (index: number) => {
    setIdeaData((current) => ({
      ...current,
      requirements: current.requirements.filter((_, idx) => idx !== index),
    }));
  };

  const removeTech = (category: StackCategory, index: number) => {
    setIdeaData((current) => ({
      ...current,
      suggested_tech_stack: {
        ...current.suggested_tech_stack,
        [category]: (current.suggested_tech_stack[category] ?? []).filter(
          (_, idx) => idx !== index,
        ),
      },
    }));
  };

  const displayedFeatures = ideaData.key_features;
  const displayedRequirements = ideaData.requirements;

  return (
    <div
      ref={scrollRef}
      className="relative w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
      style={{ ...INTER, backgroundColor: BG }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto no-scrollbar">
        <motion.div
          className={`mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-8 lg:pl-10 transition-[padding-right] duration-300 ${aiOpen ? "lg:pr-85" : "lg:pr-10"}`}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Top bar — refresh / save */}
          <motion.div
            variants={fadeUp(0)}
            className="mb-8 flex flex-wrap items-center justify-end gap-2"
          >
            <button
              onClick={fetchIdea}
              className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <button
              onClick={handleManualSave}
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
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-t-transparent"
                style={{ borderColor: ACCENT, borderTopColor: "transparent" }}
              />
              <p
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ ...MONO, color: ACCENT }}
              >
                {isJobLoading
                  ? "Generating idea section"
                  : isSaving
                    ? "Saving idea section"
                    : "Loading idea section"}
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
              Section // 01 / Concept
            </p>
          </motion.div>

          {/* Giant headline */}
          <motion.div variants={fadeUp(2)} className="mb-6">
            <h1
              className="text-[3.4rem] sm:text-[4.2rem] md:text-[5rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
              style={INTER_TIGHT}
            >
              Ideation
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
              Ver: {hasAnyContent ? "4.2.0" : "0.0.0"}
            </span>
            <span
              className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              {ideaData.estimated_complexity === "high"
                ? "High_Complexity_Core"
                : ideaData.estimated_complexity === "low"
                  ? "Low_Complexity_Core"
                  : "Stable_Diffusion_Core"}
            </span>
          </motion.div>

          {/* Section header — Concept Overview */}
          <motion.div
            variants={fadeUp(4)}
            className="mb-4 flex items-center gap-3"
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0"
              style={{ ...MONO, color: MUTED }}
            >
              Concept Overview
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          </motion.div>

          {/* Raw idea — serif italic editable block */}
          <motion.div variants={fadeUp(5)} className="mb-3">
            <div
              className="border px-7 py-7"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              <textarea
                value={ideaData.raw_idea}
                onChange={(e) =>
                  setIdeaData((current) => ({
                    ...current,
                    raw_idea: e.target.value,
                  }))
                }
                placeholder="Describe your project idea here..."
                rows={6}
                className="w-full resize-y bg-transparent text-[1.15rem] italic leading-relaxed text-white outline-none placeholder:text-white/35 placeholder:not-italic"
                style={SERIF}
              />
            </div>
          </motion.div>

          {/* Generate / regenerate button */}
          <motion.div variants={fadeUp(6)} className="mb-12">
            {hasGeneratedOnce ? (
              <button
                onClick={handleRegenerate}
                disabled={!ideaData.raw_idea.trim() || isJobLoading}
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
                onClick={() => handleGenerate(false)}
                disabled={!ideaData.raw_idea.trim() || isJobLoading}
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

          {/* Overview */}
          <motion.div variants={fadeUp(7)} className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0"
                style={{ ...MONO, color: MUTED }}
              >
                Overview
              </span>
              <span
                className="h-px flex-1"
                style={{ backgroundColor: BORDER }}
              />
            </div>
            <div
              className="border px-6 py-5"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              <textarea
                value={ideaData.overview}
                onChange={(e) =>
                  setIdeaData((current) => ({
                    ...current,
                    overview: e.target.value,
                  }))
                }
                placeholder="Short overview of what this product does and who it serves..."
                rows={4}
                className="w-full resize-y bg-transparent text-base leading-relaxed text-white outline-none placeholder:text-white/35"
                style={INTER}
              />
            </div>
          </motion.div>

          {/* Complexity / Team / Features count */}
          <motion.div
            variants={fadeUp(8)}
            className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {[
              {
                label: "Complexity",
                node: (
                  <select
                    value={ideaData.estimated_complexity}
                    onChange={(e) =>
                      setIdeaData((current) => ({
                        ...current,
                        estimated_complexity: e.target.value as
                          | "low"
                          | "medium"
                          | "high",
                      }))
                    }
                    className="w-full bg-transparent text-base font-semibold capitalize text-white outline-none"
                    style={INTER}
                  >
                    <option style={{ backgroundColor: INNER_BG }} value="low">
                      low
                    </option>
                    <option
                      style={{ backgroundColor: INNER_BG }}
                      value="medium"
                    >
                      medium
                    </option>
                    <option style={{ backgroundColor: INNER_BG }} value="high">
                      high
                    </option>
                  </select>
                ),
              },
              {
                label: "Team Size",
                node: (
                  <input
                    value={ideaData.team_size}
                    onChange={(e) =>
                      setIdeaData((current) => ({
                        ...current,
                        team_size: e.target.value,
                      }))
                    }
                    placeholder="2-4 developers"
                    className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/35"
                    style={INTER}
                  />
                ),
              },
              {
                label: "Features Count",
                node: (
                  <p
                    className="text-base font-semibold text-white"
                    style={INTER}
                  >
                    {ideaData.key_features.length}
                  </p>
                ),
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
                {card.node}
              </div>
            ))}
          </motion.div>

          {/* Key Features */}
          <motion.div variants={fadeUp(9)} className="mb-12">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white" style={INTER_TIGHT}>
                Key Features
              </h2>
              <div className="flex items-center gap-3">
                <button
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...MONO, color: ACCENT }}
                >
                  Export_JSON
                </button>
                <button
                  onClick={openFeatureModal}
                  className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                  style={{
                    ...MONO,
                    borderColor: ACCENT,
                    color: ACCENT,
                    backgroundColor: `${ACCENT}12`,
                  }}
                >
                  <Plus size={13} />
                  Add
                </button>
              </div>
            </div>

            {displayedFeatures.length === 0 ? (
              <div
                className="border p-8 text-center"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <p className="text-base" style={{ ...INTER, color: MUTED }}>
                  No features added yet. Click "Add" or use "Generate
                  Suggestions" to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {displayedFeatures.map((feature, i) => (
                  <motion.div
                    key={`${feature.name}-${i}`}
                    variants={fadeUp(i * 0.05)}
                    className="group flex items-start gap-4 border-t py-5 first:border-t-0"
                    style={{ borderColor: BORDER }}
                  >
                    <span
                      className="text-[11px] font-bold tracking-[0.1em] pt-1 shrink-0 w-6"
                      style={{ ...MONO, color: MUTED }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-bold text-white"
                        style={INTER_TIGHT}
                      >
                        {feature.name}
                      </h3>
                      <p
                        className="mt-1.5 text-sm leading-relaxed"
                        style={{ ...INTER, color: MUTED }}
                      >
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className="px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{
                          ...MONO,
                          backgroundColor:
                            feature.priority === "must_have"
                              ? ACCENT
                              : "transparent",
                          color:
                            feature.priority === "must_have" ? "#fff" : MUTED,
                          border:
                            feature.priority === "must_have"
                              ? "none"
                              : `1px solid ${BORDER}`,
                        }}
                      >
                        {PRIORITY_LABELS[feature.priority]}
                      </span>
                      <button
                        onClick={() => removeFeature(i)}
                        className="text-[9px] uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition"
                        style={{ ...MONO, color: "#737373" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Requirements */}
          <motion.div variants={fadeUp(10)} className="mb-12">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white" style={INTER_TIGHT}>
                Requirements
              </h2>
              <button
                onClick={openRequirementModal}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Plus size={13} />
                Add
              </button>
            </div>

            {displayedRequirements.length === 0 ? (
              <div
                className="border p-8 text-center"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <p className="text-base" style={{ ...INTER, color: MUTED }}>
                  No requirements added yet. Click "Add" or use "Generate
                  Suggestions" to get started.
                </p>
              </div>
            ) : (
              <div
                className="border"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                {displayedRequirements.map((requirement, i) => (
                  <motion.div
                    key={`${requirement}-${i}`}
                    variants={fadeUp(i * 0.04)}
                    className="group flex items-start gap-3 border-t px-5 py-4 first:border-t-0"
                    style={{ borderColor: BORDER }}
                  >
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <p
                      className="flex-1 text-sm leading-relaxed text-white"
                      style={INTER}
                    >
                      {requirement}
                    </p>
                    <button
                      onClick={() => removeRequirement(i)}
                      className="opacity-0 group-hover:opacity-100 transition text-white/30 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Tech Stack */}
          <motion.div variants={fadeUp(11)}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white" style={INTER_TIGHT}>
                Tech Stack
              </h2>
              <button
                onClick={openTechModal}
                className="flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Plus size={13} />
                Add
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {STACK_KEYS.map((category) => {
                const items = ideaData.suggested_tech_stack[category] ?? [];
                const Icon = STACK_ICONS[category];
                const color = STACK_COLORS[category];

                return (
                  <div
                    key={category}
                    className="border p-5"
                    style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                  >
                    <div className="mb-4 flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center"
                        style={{
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          color,
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ ...MONO, color }}
                      >
                        {category}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {items.length > 0 ? (
                        items.map((item, i) => (
                          <span
                            key={`${item}-${i}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                            style={{
                              background: `${color}12`,
                              border: `1px solid ${color}22`,
                              color,
                            }}
                          >
                            {item}
                            <button
                              onClick={() => removeTech(category, i)}
                              className="opacity-80 hover:opacity-100"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span
                          className="px-3 py-1.5 text-xs font-semibold"
                          style={{
                            border: `1px solid ${BORDER}`,
                            color: "#737373",
                          }}
                        >
                          Not added
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AIRightSidebar
        isOpen={aiOpen}
        onOpenChange={setAiOpen}
        onApplySuggestion={handleApplySuggestion}
        projectDescription={ideaData.raw_idea || ""}
      />

      {/* Add modal */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
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
                  {activeModal === "feature"
                    ? "Add Feature"
                    : activeModal === "requirement"
                      ? "Add Requirement"
                      : "Add Tech Stack Item"}
                </p>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 transition hover:text-white"
                  style={{ color: MUTED }}
                >
                  <X size={16} />
                </button>
              </div>

              {activeModal === "feature" && (
                <form onSubmit={addFeature} className="space-y-4">
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Name
                    </p>
                    <input
                      value={featureForm.name}
                      onChange={(e) =>
                        setFeatureForm((c) => ({ ...c, name: e.target.value }))
                      }
                      placeholder="Feature name"
                      className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: INNER_BG,
                        ...INTER,
                      }}
                    />
                  </div>
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Description
                    </p>
                    <textarea
                      value={featureForm.description}
                      onChange={(e) =>
                        setFeatureForm((c) => ({
                          ...c,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="One-sentence feature description"
                      className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: INNER_BG,
                        ...INTER,
                      }}
                    />
                  </div>
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Priority
                    </p>
                    <select
                      value={featureForm.priority}
                      onChange={(e) =>
                        setFeatureForm((c) => ({
                          ...c,
                          priority: e.target.value as FeaturePriority,
                        }))
                      }
                      className="w-full border px-4 py-3 text-base text-white outline-none"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: INNER_BG,
                        ...INTER,
                      }}
                    >
                      <option value="must_have">Critical</option>
                      <option value="nice_to_have">Optional</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                      style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                      style={{
                        ...MONO,
                        borderColor: ACCENT,
                        color: ACCENT,
                        backgroundColor: `${ACCENT}12`,
                      }}
                    >
                      Add Feature
                    </button>
                  </div>
                </form>
              )}

              {activeModal === "requirement" && (
                <form onSubmit={addRequirement} className="space-y-4">
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Requirement
                    </p>
                    <textarea
                      value={requirementForm}
                      onChange={(e) => setRequirementForm(e.target.value)}
                      rows={3}
                      placeholder="Describe a non-functional/system requirement"
                      className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: INNER_BG,
                        ...INTER,
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                      style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                      style={{
                        ...MONO,
                        borderColor: ACCENT,
                        color: ACCENT,
                        backgroundColor: `${ACCENT}12`,
                      }}
                    >
                      Add Requirement
                    </button>
                  </div>
                </form>
              )}

              {activeModal === "tech" && (
                <form onSubmit={addTechItem} className="space-y-4">
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Category
                    </p>
                    <select
                      value={techForm.category}
                      onChange={(e) =>
                        setTechForm((c) => ({
                          ...c,
                          category: e.target.value as StackCategory,
                        }))
                      }
                      className="w-full border px-4 py-3 text-base text-white outline-none"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: INNER_BG,
                        ...INTER,
                      }}
                    >
                      {STACK_KEYS.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Item
                    </p>
                    <input
                      value={techForm.value}
                      onChange={(e) =>
                        setTechForm((c) => ({ ...c, value: e.target.value }))
                      }
                      placeholder="e.g. Next.js, PostgreSQL"
                      className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                      style={{
                        borderColor: BORDER,
                        backgroundColor: INNER_BG,
                        ...INTER,
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                      style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition"
                      style={{
                        ...MONO,
                        borderColor: ACCENT,
                        color: ACCENT,
                        backgroundColor: `${ACCENT}12`,
                      }}
                    >
                      Add Item
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  Preview Generated Idea
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
                {previewData.raw_idea && (
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Raw Idea
                    </p>
                    <p className="text-sm italic text-white" style={SERIF}>
                      {previewData.raw_idea}
                    </p>
                  </div>
                )}

                {previewData.overview && (
                  <div>
                    <p
                      className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Overview
                    </p>
                    <p className="text-sm text-white" style={INTER}>
                      {previewData.overview}
                    </p>
                  </div>
                )}

                {previewData.key_features.length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Key Features
                    </p>
                    <div className="space-y-2">
                      {previewData.key_features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="border p-3"
                          style={{
                            borderColor: BORDER,
                            backgroundColor: INNER_BG,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className="font-semibold text-white"
                              style={INTER}
                            >
                              {feature.name}
                            </p>
                            <span
                              className="whitespace-nowrap px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{
                                ...MONO,
                                background: `${PRIORITY_COLORS[feature.priority]}15`,
                                color: PRIORITY_COLORS[feature.priority],
                              }}
                            >
                              {PRIORITY_LABELS[feature.priority]}
                            </span>
                          </div>
                          <p
                            className="text-xs"
                            style={{ ...INTER, color: MUTED }}
                          >
                            {feature.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.requirements.length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Requirements
                    </p>
                    <div className="space-y-2">
                      {previewData.requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-white"
                          style={INTER}
                        >
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: ACCENT }}
                          />
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {STACK_KEYS.some(
                  (key) =>
                    (previewData.suggested_tech_stack[key] ?? []).length > 0,
                ) && (
                  <div>
                    <p
                      className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Suggested Tech Stack
                    </p>
                    <div className="space-y-3">
                      {STACK_KEYS.map((category) => {
                        const items =
                          previewData.suggested_tech_stack[category] ?? [];
                        if (items.length === 0) return null;
                        const Icon = STACK_ICONS[category];
                        const color = STACK_COLORS[category];
                        return (
                          <div key={category}>
                            <div className="mb-2 flex items-center gap-2">
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  background: `${color}15`,
                                  border: `1px solid ${color}30`,
                                  color,
                                  width: 24,
                                  height: 24,
                                }}
                              >
                                <Icon size={14} />
                              </div>
                              <p
                                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                                style={{ ...MONO, color }}
                              >
                                {category}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {items.map((item, i) => (
                                <span
                                  key={`${item}-${i}`}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold"
                                  style={{
                                    background: `${color}12`,
                                    border: `1px solid ${color}22`,
                                    color,
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {previewData.estimated_complexity && (
                    <div>
                      <p
                        className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ ...MONO, color: MUTED }}
                      >
                        Estimated Complexity
                      </p>
                      <p
                        className="capitalize text-sm font-semibold text-white"
                        style={INTER}
                      >
                        {previewData.estimated_complexity}
                      </p>
                    </div>
                  )}
                  {previewData.team_size && (
                    <div>
                      <p
                        className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ ...MONO, color: MUTED }}
                      >
                        Team Size
                      </p>
                      <p
                        className="text-sm font-semibold text-white"
                        style={INTER}
                      >
                        {previewData.team_size}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="mt-8 flex justify-end gap-3 border-t pt-6"
                style={{ borderColor: BORDER }}
              >
                <button
                  onClick={handleRegenerate}
                  disabled={acceptingPreview || isJobLoading}
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
                  disabled={acceptingPreview}
                  className="border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50"
                  style={{ ...MONO, borderColor: BORDER, color: MUTED }}
                >
                  Reject
                </button>
                <button
                  onClick={handleAcceptPreview}
                  disabled={acceptingPreview}
                  className="flex items-center gap-2 border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-50"
                  style={{
                    ...MONO,
                    borderColor: "#22c55e55",
                    color: "#22c55e",
                    backgroundColor: "#22c55e12",
                  }}
                >
                  {acceptingPreview ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-300/30 border-t-green-300" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Accept & Save
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
