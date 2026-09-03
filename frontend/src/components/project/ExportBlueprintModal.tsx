"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText, Database, Code, Check } from "lucide-react";
import {
  downloadFile,
  generateMarkdownBlueprint,
  generateSqlSchema,
} from "@/src/utils/exportBlueprint";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
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

interface ExportBlueprintModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  sections: {
    idea?: any;
    database?: any;
    api?: any;
    folder?: any;
  };
}

export default function ExportBlueprintModal({
  open,
  onClose,
  projectName,
  sections,
}: ExportBlueprintModalProps) {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownBlueprint(projectName, sections);
    const slug = projectName.toLowerCase().replace(/\s+/g, "_");
    downloadFile(`${slug}_ARCHITECTURE.md`, md, "text/markdown");
    setDownloadedFormat("markdown");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handleDownloadSql = () => {
    const sql = generateSqlSchema(sections.database);
    const slug = projectName.toLowerCase().replace(/\s+/g, "_");
    downloadFile(`${slug}_schema.sql`, sql, "text/plain");
    setDownloadedFormat("sql");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  const handleDownloadApiJson = () => {
    const json = JSON.stringify(sections.api || {}, null, 2);
    const slug = projectName.toLowerCase().replace(/\s+/g, "_");
    downloadFile(`${slug}_api_spec.json`, json, "application/json");
    setDownloadedFormat("api");
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="w-full max-w-xl border p-7"
          style={{ borderColor: BORDER, backgroundColor: BG, ...INTER }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p
                className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ ...MONO, color: ACCENT }}
              >
                Artifacts // Export
              </p>
              <h2
                className="text-2xl font-black uppercase leading-none text-white"
                style={INTER_TIGHT}
              >
                Export Architecture Blueprint
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 transition hover:text-white"
              style={{ color: MUTED }}
            >
              <X size={18} />
            </button>
          </div>

          <p className="mb-6 text-sm text-[#A1A1AA] leading-relaxed">
            Download production-ready architecture documentation, database schemas, and API specs generated for <strong className="text-white">{projectName}</strong>.
          </p>

          {/* Export Options */}
          <div className="space-y-3 mb-8">
            {/* Markdown Doc */}
            <div
              className="flex items-center justify-between border p-4 transition-colors hover:border-[#d84c28]/60"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center border"
                  style={{ borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}12` }}
                >
                  <FileText size={18} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Full Architecture Document</p>
                  <p className="text-[12px] text-[#71717A]" style={MONO}>ARCHITECTURE.md (Concepts, Schema, APIs, Tree)</p>
                </div>
              </div>
              <button
                onClick={handleDownloadMarkdown}
                className="flex cursor-pointer items-center gap-1.5 border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition hover:bg-[#d84c28] hover:text-black"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                {downloadedFormat === "markdown" ? (
                  <>
                    <Check size={13} /> Downloaded
                  </>
                ) : (
                  <>
                    <Download size={13} /> Export .md
                  </>
                )}
              </button>
            </div>

            {/* SQL Schema */}
            <div
              className="flex items-center justify-between border p-4 transition-colors hover:border-[#d84c28]/60"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center border border-blue-500/40 bg-blue-500/10"
                >
                  <Database size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">PostgreSQL DDL Schema</p>
                  <p className="text-[12px] text-[#71717A]" style={MONO}>schema.sql (Ready for PostgreSQL & Supabase)</p>
                </div>
              </div>
              <button
                onClick={handleDownloadSql}
                disabled={!sections.database}
                className="flex cursor-pointer items-center gap-1.5 border border-blue-500/50 bg-blue-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-400 transition hover:bg-blue-500 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
                style={MONO}
              >
                {downloadedFormat === "sql" ? (
                  <>
                    <Check size={13} /> Downloaded
                  </>
                ) : (
                  <>
                    <Download size={13} /> Export .sql
                  </>
                )}
              </button>
            </div>

            {/* API JSON */}
            <div
              className="flex items-center justify-between border p-4 transition-colors hover:border-[#d84c28]/60"
              style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center border border-emerald-500/40 bg-emerald-500/10"
                >
                  <Code size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">API & Realtime Events Spec</p>
                  <p className="text-[12px] text-[#71717A]" style={MONO}>api_spec.json (REST routes & WebSockets)</p>
                </div>
              </div>
              <button
                onClick={handleDownloadApiJson}
                disabled={!sections.api}
                className="flex cursor-pointer items-center gap-1.5 border border-emerald-500/50 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-400 transition hover:bg-emerald-500 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
                style={MONO}
              >
                {downloadedFormat === "api" ? (
                  <>
                    <Check size={13} /> Downloaded
                  </>
                ) : (
                  <>
                    <Download size={13} /> Export .json
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t pt-4" style={{ borderColor: BORDER }}>
            <button
              onClick={onClose}
              className="cursor-pointer border px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
              style={{ ...MONO, borderColor: BORDER }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
