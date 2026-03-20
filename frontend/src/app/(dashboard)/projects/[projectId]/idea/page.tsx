"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Lightbulb, Sparkles, Plus, X,
  Pencil, Check, Users,
  Database, Server, Cpu, Globe, Layers,
  ArrowRight, RotateCcw, ChevronDown,
} from "lucide-react";
import AIRightSidebar, { type ApplySuggestion } from "@/src/components/layout/project-section/AIRightSidebar";

// Types
type FeaturePriority = "critical" | "high" | "medium" | "low";

interface IdeaFeature {
  name: string;
  description: string;
  priority: FeaturePriority;
}

interface SuggestedTechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  infrastructure?: string[];
  ai?: string[];
  frameworks?: string[];
}

interface IdeaSectionContent {
  raw_idea: string;
  overview: string;
  key_features: IdeaFeature[];
  requirements: string[];
  suggested_tech_stack: SuggestedTechStack;
  estimated_complexity: "low" | "medium" | "high";
  team_size: string;
}

// Animation helpers
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: EASE } as Transition,
});
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, delay } as Transition,
});

// Priority config
const PRIORITY_CONFIG: Record<FeaturePriority, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)"  },
  high:     { label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  medium:   { label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  low:      { label: "Low",      color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
};

const COMPLEXITY_CONFIG = {
  low:    { label: "Low",    color: "#22c55e", description: "Simple CRUD, minimal integrations" },
  medium: { label: "Medium", color: "#f59e0b", description: "Moderate integrations, some complexity" },
  high:   { label: "High",   color: "#ef4444", description: "Complex systems, many moving parts" },
};

const STACK_ICONS: Record<string, React.ElementType> = {
  frontend: Globe, backend: Server, database: Database,
  infrastructure: Cpu, ai: Sparkles, frameworks: Layers,
};

const EMPTY_IDEA: IdeaSectionContent = {
  raw_idea: "", overview: "", key_features: [], requirements: [],
  suggested_tech_stack: { frontend: [], backend: [], database: [] },
  estimated_complexity: "medium", team_size: "",
};

const MOCK_GENERATED: IdeaSectionContent = {
  raw_idea: "A distributed neural processing platform for real-time edge inference.",
  overview: "An enterprise-grade distributed platform enabling teams to deploy neural models at the edge with sub-10ms latency. The system coordinates model orchestration, versioning, and real-time inference across geo-distributed clusters.",
  key_features: [
    { name: "Model Orchestration", description: "Deploy and manage neural models across distributed nodes with zero-downtime updates", priority: "critical" },
    { name: "Real-time Inference API", description: "REST + WebSocket endpoints with sub-10ms response times and automatic load balancing", priority: "critical" },
    { name: "Edge Node Management", description: "Monitor, configure, and update edge nodes from a central dashboard", priority: "high" },
    { name: "Version Control", description: "Git-like versioning for model weights, configurations, and deployment history", priority: "high" },
    { name: "Analytics Dashboard", description: "Real-time metrics on latency, throughput, error rates, and resource utilization", priority: "medium" },
    { name: "Team Collaboration", description: "Role-based access control, shared workspaces, and activity audit logs", priority: "low" },
  ],
  requirements: [
    "Must support 99.99% uptime SLA across all edge nodes",
    "Sub-10ms inference latency at the 99th percentile",
    "Support for PyTorch, TensorFlow, and ONNX model formats",
    "End-to-end encryption for model weights and inference data",
    "Horizontal scaling to 1000+ edge nodes without performance degradation",
    "Comprehensive REST API with OpenAPI 3.0 specification",
    "Real-time monitoring with configurable alerting thresholds",
  ],
  suggested_tech_stack: {
    frontend: ["Next.js 14", "TypeScript", "Tailwind CSS", "Recharts"],
    backend: ["Node.js", "Fastify", "tRPC", "WebSockets"],
    database: ["PostgreSQL", "Redis", "InfluxDB"],
    infrastructure: ["Kubernetes", "Docker", "Terraform", "Vercel"],
    ai: ["PyTorch Serve", "ONNX Runtime", "OpenAI API"],
    frameworks: ["Prisma ORM", "Zod", "React Query"],
  },
  estimated_complexity: "high",
  team_size: "4-6 developers",
};

// Sub-components

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[9px] text-white/25 tracking-[0.2em] font-mono uppercase mb-3">
      {label}
    </p>
  );
}

function EditableText({
  value, onChange, placeholder, multiline = false, className = "",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onChange(draft); setEditing(false); };

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit} rows={4}
        className={`w-full bg-black/30 border border-orange-500/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white/75 outline-none resize-none leading-relaxed ${className}`}
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      />
    ) : (
      <input
        autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={`w-full bg-black/30 border border-orange-500/30 rounded-xl px-3.5 py-2.5 text-[13px] text-white/75 outline-none ${className}`}
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      />
    );
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`group cursor-pointer relative ${className}`}
    >
      <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-orange-500/15 pointer-events-none" />
      <Pencil size={10} className="absolute top-1 right-1 text-orange-500/0 group-hover:text-orange-500/40 transition-all duration-200" />
      {value
        ? <p className="text-[13px] text-white/60 leading-relaxed pr-4">{value}</p>
        : <p className="text-[13px] text-white/20 italic">{placeholder}</p>
      }
    </div>
  );
}

function TagInput({ tags, onChange, placeholder, color = "#f97316" }: {
  tags: string[]; onChange: (t: string[]) => void; placeholder?: string; color?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (draft.trim() && !tags.includes(draft.trim())) {
      onChange([...tags, draft.trim()]);
      setDraft("");
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-default"
          style={{ background: `${color}12`, border: `1px solid ${color}22`, color }}
        >
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} className="opacity-50 hover:opacity-100 ml-0.5">
            <X size={9} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-[11px] text-white/40 placeholder:text-white/18 min-w-[80px] flex-1"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      />
    </div>
  );
}

function FeatureCard({ feature, onUpdate, onRemove }: {
  feature: IdeaFeature; onUpdate: (f: IdeaFeature) => void; onRemove: () => void;
}) {
  const cfg = PRIORITY_CONFIG[feature.priority];
  const priorities: FeaturePriority[] = ["critical", "high", "medium", "low"];

  return (
    <motion.div
      layout {...fadeUp(0)}
      className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5 hover:border-white/[0.11] transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2">
        <EditableText
          value={feature.name}
          onChange={(v) => onUpdate({ ...feature, name: v })}
          placeholder="Feature name..."
          className="flex-1 font-bold text-white/78"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={feature.priority}
            onChange={(e) => onUpdate({ ...feature, priority: e.target.value as FeaturePriority })}
            className="text-[10px] font-bold rounded-lg px-2 py-1 border cursor-pointer outline-none appearance-none"
            style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}
          >
            {priorities.map((p) => (
              <option key={p} value={p} style={{ background: "#0c0702", color: PRIORITY_CONFIG[p].color }}>
                {PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </select>
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all duration-150 p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <EditableText
        value={feature.description}
        onChange={(v) => onUpdate({ ...feature, description: v })}
        placeholder="Describe this feature..."
        className="text-white/40"
      />
    </motion.div>
  );
}

// Main page
export default function IdeaOverviewPage() {
  const [description, setDescription]   = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [idea, setIdea]                 = useState<IdeaSectionContent>(EMPTY_IDEA);
  const [newRequirement, setNewRequirement] = useState("");
  const [aiOpen, setAiOpen]             = useState(false);

  const handleShowFields = () => {
    setIdea({ ...MOCK_GENERATED, raw_idea: description || MOCK_GENERATED.raw_idea });
    setHasGenerated(true);
  };

  const handleReset = () => {
    setHasGenerated(false);
    setIdea(EMPTY_IDEA);
  };

  const handleApplySuggestion = (suggestion: ApplySuggestion) => {
    setIdea((prev) => ({ ...prev, ...suggestion.payload }));
    if (!hasGenerated) setHasGenerated(true);
  };

  const updateFeature = (i: number, f: IdeaFeature) =>
    setIdea((prev) => { const kf = [...prev.key_features]; kf[i] = f; return { ...prev, key_features: kf }; });

  const removeFeature = (i: number) =>
    setIdea((prev) => ({ ...prev, key_features: prev.key_features.filter((_, j) => j !== i) }));

  const addFeature = () =>
    setIdea((prev) => ({ ...prev, key_features: [...prev.key_features, { name: "New Feature", description: "", priority: "medium" }] }));

  const addRequirement = () => {
    if (!newRequirement.trim()) return;
    setIdea((prev) => ({ ...prev, requirements: [...prev.requirements, newRequirement.trim()] }));
    setNewRequirement("");
  };

  const removeRequirement = (i: number) =>
    setIdea((prev) => ({ ...prev, requirements: prev.requirements.filter((_, j) => j !== i) }));

  const updateStack = (key: keyof SuggestedTechStack, tags: string[]) =>
    setIdea((prev) => ({ ...prev, suggested_tech_stack: { ...prev.suggested_tech_stack, [key]: tags } }));

  const stackSections: (keyof SuggestedTechStack)[] = ["frontend", "backend", "database", "infrastructure", "ai", "frameworks"];
  const stackColors: Record<string, string> = {
    frontend: "#60a5fa", backend: "#f97316", database: "#a78bfa",
    infrastructure: "#22c55e", ai: "#f59e0b", frameworks: "#e879f9",
  };

  return (
    <div className="flex flex-1 min-h-screen" style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}>

      {/* Main scrollable area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">

        {/* Sub-nav */}
        <motion.div
          {...fadeIn(0)}
          className="flex items-center justify-between px-7 py-2 border-b border-white/[0.04] flex-wrap gap-2 pl-14 md:pl-7 shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/18 flex items-center justify-center">
              <Lightbulb size={12} className="text-orange-500" />
            </div>
            <span className="text-[11px] text-white/35 font-mono tracking-[0.1em]">IDEA OVERVIEW</span>
          </div>

          {/* Right side of sub-nav: reset + AI button */}
          <div className="flex items-center gap-2">
            {hasGenerated && (
              <motion.button
                {...fadeIn()}
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] text-white/28 font-mono tracking-[0.06em] hover:text-white/55 transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                Reset
              </motion.button>
            )}

            {/* AI Copilot toggle button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setAiOpen((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-[0.06em] border transition-all duration-200 cursor-pointer ${
                aiOpen
                  ? "bg-orange-500/18 border-orange-500/35 text-orange-400"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-orange-400 hover:bg-orange-500/[0.07] hover:border-orange-500/20"
              }`}
            >
              <Sparkles size={12} className={aiOpen ? "text-orange-400" : ""} />
              <span>AI Scout</span>
              {aiOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)] ml-0.5" />
              )}
            </motion.button>
          </div>
        </motion.div>

        <main className="flex-1 px-7 py-8 flex flex-col gap-8">

          {/* Page title */}
          <motion.div {...fadeUp(0.04)}>
            <h1
              className="font-bold leading-tight mb-2"
              style={{
                fontSize: "clamp(26px, 3.5vw, 44px)",
                background: "linear-gradient(90deg, #c2410c 0%, #f97316 50%, #fdba74 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Idea Overview
            </h1>
            <p className="text-[13px] text-white/30 leading-relaxed max-w-lg">
              Define the core concept and technical scope of your application. Let AI help structure your requirements.
            </p>
          </motion.div>

          {/* Project Description */}
          <motion.div {...fadeUp(0.08)} className="flex flex-col gap-3">
            <SectionHeader label="Project Description" />
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail your project goals, core functionalities, and intended problem-solving approach. The more detail you provide, the better AI can help structure your requirements..."
                rows={5}
                className="w-full bg-white/[0.025] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-[13.5px] text-white/65 placeholder:text-white/20 outline-none resize-none leading-[1.75] focus:border-orange-500/30 focus:bg-white/[0.035] transition-all duration-200"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-white/18 font-mono">
                {description.length} chars
              </div>
            </div>

            {/* Show Fields button */}
            <div className="flex items-center gap-3 flex-wrap">
              {!hasGenerated ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShowFields}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-[13px] font-bold tracking-[0.08em] border-none cursor-pointer bg-gradient-to-r from-orange-600 to-orange-400 text-[#0f0800] shadow-[0_0_24px_rgba(249,115,22,0.18)] transition-all duration-200"
                >
                  <ChevronDown size={15} />
                  Show Project Fields
                </motion.button>
              ) : (
                <motion.span
                  {...fadeIn()}
                  className="flex items-center gap-1.5 text-[11px] text-green-400/70 font-mono tracking-[0.06em]"
                >
                  <Check size={11} />
                  Fields visible — edit any section below
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Generated sections */}
          <AnimatePresence>
            {hasGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE } as Transition}
                className="flex flex-col gap-8"
              >
                {/* Overview */}
                <motion.div {...fadeUp(0.05)} className="flex flex-col gap-3">
                  <SectionHeader label="Overview" />
                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5">
                    <EditableText
                      value={idea.overview}
                      onChange={(v) => setIdea((p) => ({ ...p, overview: v }))}
                      placeholder="Project overview..."
                      multiline
                    />
                  </div>
                </motion.div>

                {/* Complexity + Team Size */}
                <motion.div {...fadeUp(0.08)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
                    <SectionHeader label="Estimated Complexity" />
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as const).map((c) => {
                        const cfg = COMPLEXITY_CONFIG[c];
                        const active = idea.estimated_complexity === c;
                        return (
                          <button
                            key={c}
                            onClick={() => setIdea((p) => ({ ...p, estimated_complexity: c }))}
                            className="flex-1 py-2.5 rounded-xl text-[12px] font-bold tracking-[0.06em] border transition-all duration-200 cursor-pointer"
                            style={active
                              ? { background: `${cfg.color}18`, borderColor: `${cfg.color}35`, color: cfg.color }
                              : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)" }
                            }
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-white/28 font-mono">
                      {COMPLEXITY_CONFIG[idea.estimated_complexity].description}
                    </p>
                  </div>

                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
                    <SectionHeader label="Team Size" />
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/18 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-orange-500" />
                      </div>
                      <EditableText
                        value={idea.team_size}
                        onChange={(v) => setIdea((p) => ({ ...p, team_size: v }))}
                        placeholder="e.g. 3-5 developers"
                        className="flex-1 text-[18px] font-bold text-white/70"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Key Features */}
                <motion.div {...fadeUp(0.11)} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <SectionHeader label="Key Features" />
                    <button
                      onClick={addFeature}
                      className="flex items-center gap-1.5 text-[11px] text-orange-500/65 hover:text-orange-500 font-mono tracking-[0.06em] transition-colors cursor-pointer"
                    >
                      <Plus size={12} />
                      Add Feature
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {idea.key_features.map((f, i) => (
                      <FeatureCard
                        key={i} feature={f}
                        onUpdate={(nf) => updateFeature(i, nf)}
                        onRemove={() => removeFeature(i)}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Requirements */}
                <motion.div {...fadeUp(0.14)} className="flex flex-col gap-3">
                  <SectionHeader label="Requirements" />
                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2">
                    {idea.requirements.map((req, i) => (
                      <motion.div
                        key={i} layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-2.5 group py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors duration-150"
                      >
                        <ArrowRight size={12} className="text-orange-500/45 mt-0.5 shrink-0" />
                        <p className="flex-1 text-[13px] text-white/55 leading-relaxed">{req}</p>
                        <button
                          onClick={() => removeRequirement(i)}
                          className="opacity-0 group-hover:opacity-100 text-white/22 hover:text-red-400 transition-all duration-150 shrink-0 mt-0.5"
                        >
                          <X size={11} />
                        </button>
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/[0.05]">
                      <Plus size={11} className="text-orange-500/40 shrink-0" />
                      <input
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addRequirement()}
                        placeholder="Add a requirement..."
                        className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-white/45 placeholder:text-white/18"
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                      />
                      {newRequirement.trim() && (
                        <button onClick={addRequirement} className="text-orange-500 hover:text-orange-400 transition-colors">
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Tech Stack */}
                <motion.div {...fadeUp(0.17)} className="flex flex-col gap-3">
                  <SectionHeader label="Suggested Tech Stack" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stackSections.map((section) => {
                      const tags = idea.suggested_tech_stack[section] ?? [];
                      const Icon = STACK_ICONS[section];
                      const color = stackColors[section];
                      if (section !== "frontend" && section !== "backend" && section !== "database" && tags.length === 0) return null;
                      return (
                        <div
                          key={section}
                          className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-2.5 hover:border-white/[0.11] transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{ background: `${color}12`, border: `1px solid ${color}22`, color }}
                            >
                              <Icon size={12} />
                            </div>
                            <span className="text-[9px] tracking-[0.16em] font-mono uppercase" style={{ color }}>
                              {section}
                            </span>
                          </div>
                          <TagInput
                            tags={tags}
                            onChange={(t) => updateStack(section, t)}
                            placeholder={`Add ${section}...`}
                            color={color}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty nudge */}
          {!hasGenerated && (
            <motion.div
              {...fadeUp(0.2)}
              className="flex flex-col items-center text-center py-16 gap-4 border border-dashed border-white/[0.07] rounded-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-500/[0.07] border border-orange-500/15 flex items-center justify-center">
                <Lightbulb size={24} className="text-orange-500/60" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[15px] font-bold text-white/40">Start with your idea</p>
                <p className="text-[12.5px] text-white/20 max-w-[300px] leading-relaxed">
                  Click "Show Project Fields" above to open all sections and start filling in your idea.
                </p>
              </div>
            </motion.div>
          )}

        </main>
      </div>

      {/* AI Right Sidebar - controlled by toggle */}
      {aiOpen && (
        <AIRightSidebar
          onApplySuggestion={handleApplySuggestion}
          projectDescription={description}
        />
      )}
    </div>
  );
}