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
} from "lucide-react";
import {
  fetchSectionByType,
  upsertSection,
} from "@/src/store/slices/sectionSlice";
import {
  clearJobState,
  generateIdea,
  getJobStatusThunk,
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

const PRIORITY_COLORS: Record<FeaturePriority, string> = {
  must_have: "#f97316",
  nice_to_have: "#94a3b8",
};

const PRIORITY_LABELS: Record<FeaturePriority, string> = {
  must_have: "Must Have",
  nice_to_have: "Nice To Have",
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
  backend: "#f97316",
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
  const [aiOpen, setAiOpen] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

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

  const isFetching = Boolean(ideaSectionState?.fetch.loading);
  const isSaving = Boolean(ideaSectionState?.save.loading);
  const isJobLoading =
    jobState.status === "pending" || jobState.status === "processing";
  const loading = isFetching || isSaving || isJobLoading;
  const sectionError =
    ideaSectionState?.fetch.error ?? ideaSectionState?.save.error ?? null;
  const error = sectionError ?? (jobState.status === "failed" ? jobState.error : null);

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

  const handleGenerate = async () => {
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
        }),
      ).unwrap();

      setStatus("Idea generation queued. We are processing it now.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to queue idea generation.");
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

    fetchIdea();
    setStatus("Idea generation completed.");
    setStatusType("success");
    dispatch(clearJobState());
  }, [dispatch, fetchIdea, jobState.status]);

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
      className="flex w-full flex-1 overflow-y-auto overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="min-w-0 flex-1 overflow-y-auto">
        <motion.div
          className={`mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 transition-[padding-right] duration-300 ${
            aiOpen ? "lg:pr-85" : "lg:pr-0"
          }`}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fadeUp(0)}
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/8 bg-[#0b1019] px-4 py-3"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
              <span>Planex</span>
              <span>/</span>
              <span>
                {(
                  ideaData.raw_idea.split(" ").slice(0, 3).join(" ") ||
                  "Project"
                ).toUpperCase()}
              </span>
              <span>/</span>
              <span className="text-white/80">IDEA</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchIdea}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 transition hover:border-white/20 hover:text-white/85"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Save size={12} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>

          {loading && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2.5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400/90">
                {isJobLoading
                  ? "Generating idea section"
                  : isSaving
                    ? "Saving idea section"
                    : "Loading idea section"}
              </p>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm"
              >
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-semibold text-red-500">Error</p>
                  <p className="mt-1 text-sm text-red-500/75">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 backdrop-blur-sm ${
                  statusType === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                }`}
              >
                <div className="flex-shrink-0">
                  {statusType === "success" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, ease: "backOut" }}
                    >
                      <CheckCircle
                        size={18}
                        className="text-emerald-500"
                      />
                    </motion.div>
                  ) : (
                    <Zap size={18} className="text-amber-500" />
                  )}
                </div>
                <p
                  className={`text-sm font-medium ${
                    statusType === "success"
                      ? "text-emerald-500/90"
                      : "text-amber-500/90"
                  }`}
                >
                  {status}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp(1)} className="mb-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <Lightbulb size={20} className="text-orange-500" />
                </div>
                <div>
                  <h1
                    className="text-4xl font-bold uppercase text-white"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                  >
                    IDEA
                  </h1>
                  <p className="mt-1 text-base text-white/50">
                    Define your project concept and scope
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">
                {hasAnyContent ? "Draft loaded" : "Empty"}
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(2)} className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p
                className="text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Raw Idea
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-6 mb-4">
              <textarea
                value={ideaData.raw_idea}
                onChange={(e) =>
                  setIdeaData((current) => ({
                    ...current,
                    raw_idea: e.target.value,
                  }))
                }
                placeholder="Describe your project idea here..."
                rows={5}
                className="w-full resize-y bg-transparent text-base leading-relaxed text-white/80 outline-none placeholder:text-white/35"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={!ideaData.raw_idea.trim() || isJobLoading}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-orange-500/35 bg-orange-500/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-500/15"
            >
              <Sparkles size={18} />
              {isJobLoading ? "Generating..." : "Generate Suggestions"}
            </button>
          </motion.div>

          <motion.div variants={fadeUp(3)} className="mb-8">
            <p
              className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
              style={{ fontFamily: "'Roboto', sans-serif" }}
            >
              Overview
            </p>
            <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-6">
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
                className="w-full resize-y bg-transparent text-base leading-relaxed text-white/75 outline-none placeholder:text-white/35"
              />
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp(4)}
            className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-6">
              <p
                className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Complexity
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: `${
                      ideaData.estimated_complexity === "high"
                        ? "#ef4444"
                        : ideaData.estimated_complexity === "medium"
                          ? "#f59e0b"
                          : "#22c55e"
                    }15`,
                    border: `1px solid ${
                      ideaData.estimated_complexity === "high"
                        ? "#ef4444"
                        : ideaData.estimated_complexity === "medium"
                          ? "#f59e0b"
                          : "#22c55e"
                    }30`,
                    color:
                      ideaData.estimated_complexity === "high"
                        ? "#ef4444"
                        : ideaData.estimated_complexity === "medium"
                          ? "#f59e0b"
                          : "#22c55e",
                  }}
                >
                  <Zap size={16} />
                </div>
                <div className="w-full">
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
                    className="w-full bg-transparent text-base font-semibold capitalize text-white/80 outline-none"
                  >
                    <option className="bg-[#0a0f18]" value="low">
                      low
                    </option>
                    <option className="bg-[#0a0f18]" value="medium">
                      medium
                    </option>
                    <option className="bg-[#0a0f18]" value="high">
                      high
                    </option>
                  </select>
                  <p className="mt-1 text-xs text-white/35">
                    Estimated implementation scope
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-6">
              <p
                className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Team Size
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/15 text-blue-500">
                  <Globe size={16} />
                </div>
                <input
                  value={ideaData.team_size}
                  onChange={(e) =>
                    setIdeaData((current) => ({
                      ...current,
                      team_size: e.target.value,
                    }))
                  }
                  placeholder="2-4 developers"
                  className="w-full bg-transparent text-base font-semibold text-white/75 outline-none placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-6">
              <p
                className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Features Count
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/15 text-purple-500">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-base font-semibold text-white/80">
                    {ideaData.key_features.length}
                  </p>
                  <p className="mt-0.5 text-xs text-white/35">Features added</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(5)} className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p
                className="text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Key Features
              </p>
              <button
                onClick={openFeatureModal}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Plus size={16} />
                Add Feature
              </button>
            </div>
            {displayedFeatures.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-8 text-center">
                <p className="text-white/45 text-base">
                  No features added yet. Click "Add Feature" or use "Generate
                  Suggestions" to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {displayedFeatures.map((feature, i) => (
                  <motion.div
                    key={`${feature.name}-${i}`}
                    variants={fadeUp(i * 0.05)}
                    className="group rounded-xl border border-white/[0.07] bg-white/2.5 p-5 transition-all duration-200 hover:border-white/11"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white/85">
                          {feature.name}
                        </h3>
                        <p className="mt-2 text-xs uppercase tracking-widest text-white/45">
                          {PRIORITY_LABELS[feature.priority]}
                        </p>
                      </div>
                      {ideaData.key_features.length > 0 && (
                        <button
                          onClick={() => removeFeature(i)}
                          className="rounded-md p-1 text-white/35 transition hover:bg-white/8 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{
                          background: `${PRIORITY_COLORS[feature.priority]}15`,
                          border: `1px solid ${PRIORITY_COLORS[feature.priority]}30`,
                        }}
                      >
                        <Circle
                          size={11}
                          style={{
                            color: PRIORITY_COLORS[feature.priority],
                            fill: PRIORITY_COLORS[feature.priority],
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-white/60">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeUp(6)} className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p
                className="text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Requirements
              </p>
              <button
                onClick={openRequirementModal}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Plus size={16} />
                Add Requirement
              </button>
            </div>
            {displayedRequirements.length === 0 ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-8 text-center">
                <p className="text-white/45 text-base">
                  No requirements added yet. Click "Add Requirement" or use
                  "Generate Suggestions" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-white/[0.07] bg-white/2.5 p-5">
                {displayedRequirements.map((requirement, i) => (
                  <motion.div
                    key={`${requirement}-${i}`}
                    variants={fadeUp(i * 0.04)}
                    className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/1 px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/3">
                      <CheckCircle size={12} className="text-white/45" />
                    </div>
                    <p className="flex-1 text-base leading-relaxed text-white/65">
                      {requirement}
                    </p>
                    {ideaData.requirements.length > 0 && (
                      <button
                        onClick={() => removeRequirement(i)}
                        className="rounded-md p-1 text-white/35 transition hover:bg-white/8 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeUp(7)}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <p
                className="text-sm font-semibold uppercase tracking-[0.15em] text-white/45"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                Tech Stack
              </p>
              <button
                onClick={openTechModal}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-orange-500/35 bg-orange-500/15 px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
              >
                <Plus size={16} />
                Add Stack Item
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {STACK_KEYS.map((category) => {
                const items = ideaData.suggested_tech_stack[category] ?? [];
                const Icon = STACK_ICONS[category];
                const color = STACK_COLORS[category];

                return (
                  <div
                    key={category}
                    className="rounded-xl border border-white/[0.07] bg-white/2.5 p-5"
                  >
                    <div className="mb-4 flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          color,
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color }}
                      >
                        {category}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {items.length > 0 ? (
                        items.map((item, i) => (
                          <span
                            key={`${item}-${i}`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                            style={{
                              background: `${color}12`,
                              border: `1px solid ${color}22`,
                              color,
                            }}
                          >
                            {item}
                            <button
                              onClick={() => removeTech(category, i)}
                              className="cursor-pointer opacity-80 transition hover:opacity-100"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-white/30">
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

      <AnimatePresence>
        {activeModal && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 z-40 bg-black/55"
              aria-label="Close modal backdrop"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#0b1019] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div className="mb-5 flex items-center justify-between">
                <p
                  className="text-lg font-bold uppercase tracking-[0.08em] text-white/90"
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  {activeModal === "feature"
                    ? "Add Feature"
                    : activeModal === "requirement"
                      ? "Add Requirement"
                      : "Add Tech Stack Item"}
                </p>
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-md p-1 text-white/40 transition hover:bg-white/8 hover:text-white/75"
                >
                  <X size={16} />
                </button>
              </div>

              {activeModal === "feature" && (
                <form onSubmit={addFeature} className="space-y-4">
                  <div>
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Name
                    </p>
                    <input
                      value={featureForm.name}
                      onChange={(e) =>
                        setFeatureForm((current) => ({
                          ...current,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Feature name"
                      className="w-full rounded-md border border-white/10 bg-[#101625] px-4 py-3 text-base text-white/85 outline-none placeholder:text-white/35 focus:border-orange-500/45"
                    />
                  </div>
                  <div>
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Description
                    </p>
                    <textarea
                      value={featureForm.description}
                      onChange={(e) =>
                        setFeatureForm((current) => ({
                          ...current,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="One-sentence feature description"
                      className="w-full rounded-md border border-white/10 bg-[#101625] px-4 py-3 text-base text-white/85 outline-none placeholder:text-white/35 focus:border-orange-500/45"
                    />
                  </div>
                  <div>
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Priority
                    </p>
                    <select
                      value={featureForm.priority}
                      onChange={(e) =>
                        setFeatureForm((current) => ({
                          ...current,
                          priority: e.target.value as FeaturePriority,
                        }))
                      }
                      className="w-full rounded-md border border-white/10 bg-[#101625] px-4 py-3 text-base text-white/85 outline-none focus:border-orange-500/45"
                    >
                      <option value="must_have">Must Have</option>
                      <option value="nice_to_have">Nice To Have</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/65 transition hover:text-white/85"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-orange-500/35 bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
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
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Requirement
                    </p>
                    <textarea
                      value={requirementForm}
                      onChange={(e) => setRequirementForm(e.target.value)}
                      rows={3}
                      placeholder="Describe a non-functional/system requirement"
                      className="w-full rounded-md border border-white/10 bg-[#101625] px-4 py-3 text-base text-white/85 outline-none placeholder:text-white/35 focus:border-orange-500/45"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/65 transition hover:text-white/85"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-orange-500/35 bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
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
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Category
                    </p>
                    <select
                      value={techForm.category}
                      onChange={(e) =>
                        setTechForm((current) => ({
                          ...current,
                          category: e.target.value as StackCategory,
                        }))
                      }
                      className="w-full rounded-md border border-white/10 bg-[#101625] px-4 py-3 text-base text-white/85 outline-none focus:border-orange-500/45"
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
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Item
                    </p>
                    <input
                      value={techForm.value}
                      onChange={(e) =>
                        setTechForm((current) => ({
                          ...current,
                          value: e.target.value,
                        }))
                      }
                      placeholder="e.g. Next.js, PostgreSQL"
                      className="w-full rounded-md border border-white/10 bg-[#101625] px-4 py-3 text-base text-white/85 outline-none placeholder:text-white/35 focus:border-orange-500/45"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/65 transition hover:text-white/85"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-orange-500/35 bg-orange-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-orange-300 transition hover:bg-orange-500/20"
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
    </div>
  );
}
