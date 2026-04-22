"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { motion, Variants } from "framer-motion";
import {
  Lightbulb,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Zap,
  Code2,
  Database,
  Globe,
  Server,
  Cpu,
  Sparkles,
  Layers,
  GitBranch,
} from "lucide-react";
import { getSectionByType } from "@/src/store/slices/projectSlice";
import type { AppDispatch } from "@/src/store/store";
import AIRightSidebar, { ApplySuggestion } from "@/src/components/layout/project-section/AIRightSidebar";

interface KeyFeature {
  name: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const PRIORITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

const PRIORITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STACK_ICONS: Record<string, React.ElementType> = {
  frontend: Globe,
  backend: Server,
  database: Database,
  infrastructure: Cpu,
  ai: Sparkles,
  frameworks: Layers,
};

const STACK_COLORS: Record<string, string> = {
  frontend: "#60a5fa",
  backend: "#f97316",
  database: "#a78bfa",
  infrastructure: "#22c55e",
  ai: "#f59e0b",
  frameworks: "#e879f9",
};

export default function IdeaPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const dispatch = useDispatch<AppDispatch>();

  const [ideaData, setIdeaData] = useState<IdeaSectionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(true);

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dispatch(
          getSectionByType({ projectId, type: "idea" }),
        ).unwrap();
        setIdeaData(result as IdeaSectionContent);
      } catch (err: any) {
        setError(err.message || "Failed to fetch idea section");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchIdea();
    }
  }, [projectId, dispatch]);

  const handleApplySuggestion = (suggestion: ApplySuggestion) => {
    if (!ideaData) return;
    const updated = { ...ideaData, ...suggestion.payload };
    setIdeaData(updated as IdeaSectionContent);
  };

  return (
    <div className="flex flex-1 w-full overflow-hidden gap-0" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
              />
            </div>
          )}

          {error && (
            <div className="p-6 m-6 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-semibold">Error</p>
                <p className="text-red-500/70 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {ideaData && (
            <motion.div
              className="p-8 max-w-6xl mx-auto w-full"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* Page Header */}
              <motion.div variants={fadeUp(0)} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    <Lightbulb size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Idea</h1>
                    <p className="text-white/40 text-sm mt-1">
                      Define your project concept and scope
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Raw Idea / Overview Section */}
              <motion.div variants={fadeUp(1)} className="mb-8">
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-6">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-4">
                    Project Description
                  </p>
                  <p className="text-white/60 leading-relaxed text-sm">
                    {ideaData.raw_idea || ideaData.overview}
                  </p>
                </div>
              </motion.div>

              {/* Overview Section */}
              {ideaData.overview && (
                <motion.div variants={fadeUp(2)} className="mb-8">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-4">
                    Overview
                  </p>
                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-6">
                    <p className="text-white/55 leading-relaxed text-sm">
                      {ideaData.overview}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Metrics Grid */}
              <motion.div
                variants={fadeUp(3)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
              >
                {/* Estimated Complexity */}
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-3">
                    Complexity
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
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
                    <div>
                      <p className="text-white/70 font-semibold text-sm capitalize">
                        {ideaData.estimated_complexity}
                      </p>
                      <p className="text-white/30 text-[11px] mt-0.5">
                        {ideaData.estimated_complexity === "high"
                          ? "Complex systems"
                          : ideaData.estimated_complexity === "medium"
                            ? "Moderate scope"
                            : "Simple scope"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Size */}
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-3">
                    Team Size
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                      <Globe size={16} />
                    </div>
                    <div>
                      <p className="text-white/70 font-semibold text-sm">
                        {ideaData.team_size || "TBD"}
                      </p>
                      <p className="text-white/30 text-[11px] mt-0.5">
                        Estimated developers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Count */}
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-3">
                    Features
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-500">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <p className="text-white/70 font-semibold text-sm">
                        {ideaData.key_features.length}
                      </p>
                      <p className="text-white/30 text-[11px] mt-0.5">
                        Key features identified
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Key Features */}
              {ideaData.key_features && ideaData.key_features.length > 0 && (
                <motion.div variants={fadeUp(4)} className="mb-8">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-4">
                    Key Features
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ideaData.key_features.map((feature, i) => (
                      <motion.div
                        key={i}
                        variants={fadeUp(i * 0.1)}
                        className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-4 group hover:border-white/[0.11] transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-white/80 font-semibold text-sm">
                              {feature.name}
                            </h3>
                            <p className="text-[11px] text-white/40 mt-2 tracking-widest uppercase">
                              {PRIORITY_LABELS[feature.priority]}
                            </p>
                          </div>
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              background: `${PRIORITY_COLORS[feature.priority]}15`,
                              border: `1px solid ${PRIORITY_COLORS[feature.priority]}30`,
                            }}
                          >
                            <GitBranch
                              size={14}
                              style={{ color: PRIORITY_COLORS[feature.priority] }}
                            />
                          </div>
                        </div>
                        <p className="text-white/50 text-[12px] leading-relaxed">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Requirements */}
              {ideaData.requirements && ideaData.requirements.length > 0 && (
                <motion.div variants={fadeUp(5)} className="mb-8">
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-4">
                    Requirements
                  </p>
                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-6 space-y-3">
                    {ideaData.requirements.map((req, i) => (
                      <motion.div
                        key={i}
                        variants={fadeUp(i * 0.05)}
                        className="flex items-start gap-3 group"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle size={12} className="text-green-500" />
                        </div>
                        <p className="text-white/55 text-sm leading-relaxed flex-1">
                          {req}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tech Stack */}
              {ideaData.suggested_tech_stack && (
                <motion.div variants={fadeUp(6)}>
                  <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-4">
                    Tech Stack
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(
                      [
                        "frontend",
                        "backend",
                        "database",
                        "infrastructure",
                        "ai",
                        "frameworks",
                      ] as const
                    ).map((category) => {
                      const items =
                        ideaData.suggested_tech_stack[category] ?? [];
                      if (items.length === 0) return null;

                      const Icon = STACK_ICONS[category];
                      const color = STACK_COLORS[category];

                      return (
                        <div
                          key={category}
                          className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5"
                        >
                          <div className="flex items-center gap-2.5 mb-4">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{
                                background: `${color}15`,
                                border: `1px solid ${color}30`,
                                color,
                              }}
                            >
                              <Icon size={14} />
                            </div>
                            <p
                              className="text-[10px] font-bold tracking-widest uppercase"
                              style={{ color }}
                            >
                              {category}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{
                                  background: `${color}12`,
                                  border: `1px solid ${color}22`,
                                  color: color,
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
                </motion.div>
              )}
            </motion.div>
          )}
      </div>

      {/* Right Sidebar - AI Copilot */}
      <AIRightSidebar
        onApplySuggestion={handleApplySuggestion}
        projectDescription={ideaData?.raw_idea || ""}
      />
    </div>
  );
}
