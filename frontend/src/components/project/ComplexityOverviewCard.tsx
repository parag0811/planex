"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cpu,
  Database,
  Globe,
  Folder,
  Sparkles,
  AlertTriangle,
  Clock,
  Users,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  calculateProjectComplexity,
  ComplexityLevel,
  ProjectComplexityResult,
} from "@/src/lib/complexityCalculator";

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};
const INTER_TIGHT: React.CSSProperties = {
  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
};

const BG = "#141414";
const ACCENT = "#d84c28";
const BORDER = "#2b2321";
const MUTED = "#a6786d";
const INNER_BG = "#101010";

interface ComplexityOverviewCardProps {
  projectId: string;
  sectionsMap: {
    idea?: any;
    database?: any;
    api?: any;
    folder?: any;
  };
  loading?: boolean;
}

function getLevelBadgeStyle(level: ComplexityLevel) {
  switch (level) {
    case "LOW":
      return {
        borderColor: "rgba(52, 211, 153, 0.4)",
        backgroundColor: "rgba(52, 211, 153, 0.1)",
        color: "#34d399",
      };
    case "MEDIUM":
      return {
        borderColor: "rgba(245, 158, 11, 0.4)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        color: "#f59e0b",
      };
    case "HIGH":
      return {
        borderColor: "rgba(216, 76, 40, 0.4)",
        backgroundColor: "rgba(216, 76, 40, 0.12)",
        color: "#d84c28",
      };
    case "VERY HIGH":
      return {
        borderColor: "rgba(236, 72, 153, 0.4)",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        color: "#ec4899",
      };
  }
}

export default function ComplexityOverviewCard({
  projectId,
  sectionsMap,
  loading = false,
}: ComplexityOverviewCardProps) {
  const result: ProjectComplexityResult = calculateProjectComplexity(sectionsMap);
  const levelBadge = getLevelBadgeStyle(result.overallLevel);

  if (loading) {
    return (
      <div
        className="w-full border p-6 text-center animate-pulse"
        style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
      >
        <p className="text-sm font-semibold text-white/50" style={MONO}>
          Analyzing project complexity & architectural metrics...
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full border p-6 sm:p-8"
      style={{ borderColor: BORDER, backgroundColor: INNER_BG, ...INTER }}
    >
      {/* Top Banner: Score & Overall Level */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b pb-6" style={{ borderColor: BORDER }}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu size={14} style={{ color: ACCENT }} />
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ ...MONO, color: ACCENT }}
            >
              System Analytics // Complexity Score
            </p>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
            style={INTER_TIGHT}
          >
            Project Complexity Assessment
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: MUTED }}>
            Evaluated across Requirements, Database Schema, API Surface, & Directory Architecture.
          </p>
        </div>

        {/* Overall score gauge & Level badge */}
        <div className="flex items-center gap-5 shrink-0 bg-black/40 border px-5 py-3.5" style={{ borderColor: BORDER }}>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ ...MONO, color: MUTED }}>
              Overall Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white" style={MONO}>
                {result.overallScore}
              </span>
              <span className="text-xs" style={{ ...MONO, color: MUTED }}>
                / 100
              </span>
            </div>
          </div>

          <div className="h-8 w-px" style={{ backgroundColor: BORDER }} />

          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ ...MONO, color: MUTED }}>
              Complexity Level
            </span>
            <span
              className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] border"
              style={{ ...MONO, ...levelBadge }}
            >
              {result.overallLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline & Velocity Recommendation Banner */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="flex items-center gap-3 border p-3.5"
          style={{ borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center text-white"
            style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
          >
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>
              Est. Timeline
            </p>
            <p className="text-sm font-semibold text-white" style={MONO}>
              {result.estimatedTimeline}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-3 border p-3.5"
          style={{ borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center text-white"
            style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
          >
            <Users size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>
              Recommended Team
            </p>
            <p className="text-sm font-semibold text-white" style={MONO}>
              {result.recommendedTeam}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-3 border p-3.5"
          style={{ borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center text-white"
            style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ ...MONO, color: MUTED }}>
              Configured Sections
            </p>
            <p className="text-sm font-semibold text-white" style={MONO}>
              {result.sectionsConfiguredCount} / 4 Sections Active
            </p>
          </div>
        </div>
      </div>

      {/* Progress Score Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ ...MONO, color: MUTED }}>
          <span>Complexity Gauge</span>
          <span style={{ color: result.color }}>{result.overallScore}% Intensity</span>
        </div>
        <div className="h-2 w-full bg-black/60 border overflow-hidden" style={{ borderColor: BORDER }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.overallScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full"
            style={{ backgroundColor: result.color }}
          />
        </div>
      </div>

      {/* 4 Breakdown Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 1. Requirements (Idea) Card */}
        <div
          className="flex flex-col justify-between border p-4 transition hover:border-white/20"
          style={{ borderColor: BORDER, backgroundColor: BG }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={15} style={{ color: ACCENT }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={MONO}>
                  Requirements
                </span>
              </div>
              <span
                className="px-2 py-0.5 text-[9px] font-bold uppercase border"
                style={{ ...MONO, ...getLevelBadgeStyle(result.scope.level) }}
              >
                {result.scope.level}
              </span>
            </div>

            <div className="space-y-2 text-xs" style={{ color: MUTED }}>
              <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                <span>Func. Requirements</span>
                <span className="font-semibold text-white" style={MONO}>{result.scope.reqCount}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                <span>Key Features</span>
                <span className="font-semibold text-white" style={MONO}>
                  {result.scope.featureCount} ({result.scope.mustHaveCount} must-have)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tech Categories</span>
                <span className="font-semibold text-white" style={MONO}>{result.scope.techCount} items</span>
              </div>
            </div>
          </div>

          <Link
            href={`/projects/${projectId}/idea`}
            className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] transition hover:text-white pt-3 border-t"
            style={{ ...MONO, color: ACCENT, borderColor: `${BORDER}80` }}
          >
            <span>Edit Requirements</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* 2. Database Card */}
        <div
          className="flex flex-col justify-between border p-4 transition hover:border-white/20"
          style={{ borderColor: BORDER, backgroundColor: BG }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database size={15} style={{ color: ACCENT }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={MONO}>
                  Database
                </span>
              </div>
              <span
                className="px-2 py-0.5 text-[9px] font-bold uppercase border"
                style={{ ...MONO, ...getLevelBadgeStyle(result.database.level) }}
              >
                {result.database.hasSchema ? result.database.level : "EMPTY"}
              </span>
            </div>

            {result.database.hasSchema ? (
              <div className="space-y-2 text-xs" style={{ color: MUTED }}>
                <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                  <span>Entities / Tables</span>
                  <span className="font-semibold text-white" style={MONO}>{result.database.entityCount}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                  <span>Total Fields</span>
                  <span className="font-semibold text-white" style={MONO}>{result.database.fieldCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Relationships</span>
                  <span className="font-semibold text-white" style={MONO}>
                    {result.database.relationCount} ({result.database.manyToManyCount} N:M)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: MUTED }}>
                No database entities created yet. Add models to compute DB schema complexity.
              </p>
            )}
          </div>

          <Link
            href={`/projects/${projectId}/database`}
            className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] transition hover:text-white pt-3 border-t"
            style={{ ...MONO, color: ACCENT, borderColor: `${BORDER}80` }}
          >
            <span>{result.database.hasSchema ? "Edit Database" : "+ Add Database"}</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* 3. API Card */}
        <div
          className="flex flex-col justify-between border p-4 transition hover:border-white/20"
          style={{ borderColor: BORDER, backgroundColor: BG }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={15} style={{ color: ACCENT }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={MONO}>
                  API Endpoints
                </span>
              </div>
              <span
                className="px-2 py-0.5 text-[9px] font-bold uppercase border"
                style={{ ...MONO, ...getLevelBadgeStyle(result.api.level) }}
              >
                {result.api.hasRoutes ? result.api.level : "EMPTY"}
              </span>
            </div>

            {result.api.hasRoutes ? (
              <div className="space-y-2 text-xs" style={{ color: MUTED }}>
                <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                  <span>REST Routes</span>
                  <span className="font-semibold text-white" style={MONO}>
                    {result.api.endpointCount} ({result.api.writeEndpointCount} write)
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                  <span>Real-time Events</span>
                  <span className="font-semibold text-white" style={MONO}>{result.api.realtimeCount} ws</span>
                </div>
                <div className="flex justify-between">
                  <span>Auth Type</span>
                  <span className="font-semibold text-white" style={MONO}>{result.api.authType}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: MUTED }}>
                No API routes or WebSockets configured yet.
              </p>
            )}
          </div>

          <Link
            href={`/projects/${projectId}/api`}
            className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] transition hover:text-white pt-3 border-t"
            style={{ ...MONO, color: ACCENT, borderColor: `${BORDER}80` }}
          >
            <span>{result.api.hasRoutes ? "Edit API Routes" : "+ Add API Routes"}</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {/* 4. Folder Structure Card */}
        <div
          className="flex flex-col justify-between border p-4 transition hover:border-white/20"
          style={{ borderColor: BORDER, backgroundColor: BG }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Folder size={15} style={{ color: ACCENT }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={MONO}>
                  Folder Structure
                </span>
              </div>
              <span
                className="px-2 py-0.5 text-[9px] font-bold uppercase border"
                style={{ ...MONO, ...getLevelBadgeStyle(result.folder.level) }}
              >
                {result.folder.hasStructure ? result.folder.level : "EMPTY"}
              </span>
            </div>

            {result.folder.hasStructure ? (
              <div className="space-y-2 text-xs" style={{ color: MUTED }}>
                <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                  <span>Files</span>
                  <span className="font-semibold text-white" style={MONO}>{result.folder.fileCount}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5" style={{ borderColor: `${BORDER}80` }}>
                  <span>Folders</span>
                  <span className="font-semibold text-white" style={MONO}>{result.folder.folderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Depth</span>
                  <span className="font-semibold text-white" style={MONO}>{result.folder.maxDepth} levels</span>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: MUTED }}>
                No folder architecture tree generated yet.
              </p>
            )}
          </div>

          <Link
            href={`/projects/${projectId}/folder`}
            className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] transition hover:text-white pt-3 border-t"
            style={{ ...MONO, color: ACCENT, borderColor: `${BORDER}80` }}
          >
            <span>{result.folder.hasStructure ? "Edit Folder Tree" : "+ Build Folder Tree"}</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Architectural Risk & Key Insights Badges */}
      {result.riskFactors.length > 0 && (
        <div className="border-t pt-6" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ ...MONO, color: MUTED }}>
              Architectural Insights & Attention Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.riskFactors.map((risk) => {
              const isWarn = risk.severity === "warning";
              return (
                <div
                  key={risk.id}
                  className="flex items-start gap-3 border p-3"
                  style={{
                    borderColor: isWarn ? "rgba(245, 158, 11, 0.3)" : BORDER,
                    backgroundColor: isWarn ? "rgba(245, 158, 11, 0.05)" : BG,
                  }}
                >
                  {isWarn ? (
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: ACCENT }} />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white" style={MONO}>
                      {risk.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                      {risk.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
