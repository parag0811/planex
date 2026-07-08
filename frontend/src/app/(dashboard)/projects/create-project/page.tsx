"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createProject } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

// ─── Design tokens ──────────────────────
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

export default function CreateProjectPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const createState = useSelector((state: RootState) => state.project.create);
  const [projectName, setProjectName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const validateProjectName = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Project name is required.";
    }

    if (trimmed.length < 3) {
      return "Project name must be at least 3 characters.";
    }

    if (trimmed.length > 50) {
      return "Project name must be 50 characters or fewer.";
    }

    return null;
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateProjectName(projectName);

    if (validationMessage) {
      setClientError(validationMessage);
      return;
    }

    setClientError(null);
    setIsSubmitting(true);

    try {
      await dispatch(createProject({ name: projectName.trim() })).unwrap();
      router.push("/projects");
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-1 flex-col pt-16 pb-16"
      style={{ ...INTER, backgroundColor: BG }}
    >
      <div className="max-w-2xl mx-auto px-6 w-full">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 transition-colors mb-10"
          style={{ color: MUTED }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={MONO}>
            Back to Projects
          </span>
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border p-8 md:p-12"
          style={{ backgroundColor: INNER_BG, borderColor: BORDER }}
        >
          {/* Header */}
          <div className="mb-10">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ ...MONO, color: ACCENT }}
            >
              Create New Project
            </p>
            <h1
              className="text-3xl md:text-4xl font-black uppercase text-white mb-4"
              style={INTER_TIGHT}
            >
              Initialize Workspace
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              Set up a new project to start building and planning your next system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateProject} className="flex flex-col gap-8">
            {/* Project Name Field */}
            <div className="flex flex-col gap-3">
              <label
                className="text-[10px] font-bold text-white uppercase tracking-[0.14em]"
                style={MONO}
              >
                Project Name
              </label>

              <motion.div
                animate={{
                  borderColor: isFocused ? ACCENT : BORDER,
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 border px-4 py-3.5"
                style={{ backgroundColor: BG }}
              >
                <Edit3 size={16} style={{ color: MUTED }} className="shrink-0" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g. Project Obsidian"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#a6786d]"
                  style={{ ...MONO }}
                />
                <AnimatePresence>
                  {projectName && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {(clientError || createState.error) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs"
                    style={{ ...MONO, color: ACCENT }}
                  >
                    {clientError ?? createState.error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Info Box */}
            <div
              className="border p-5 mb-2"
              style={{ backgroundColor: BG, borderColor: BORDER }}
            >
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                Your project workspace will be initialized with default settings. You can customize everything after creation.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3.5 border font-bold text-[10px] uppercase tracking-[0.14em] transition-colors cursor-pointer text-white hover:bg-[#141414]"
                style={{ ...MONO, backgroundColor: INNER_BG, borderColor: BORDER }}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={!projectName.trim() || isSubmitting || createState.loading}
                className={`
                  flex-1 px-6 py-3.5 border font-bold text-[10px] uppercase tracking-[0.14em] transition-colors flex items-center justify-center gap-2
                  ${!projectName.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                {isSubmitting || createState.loading ? (
                  <>
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-transparent animate-spin"
                      style={{ borderTopColor: ACCENT, borderLeftColor: ACCENT }}
                    />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Create Project</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.1em]" style={{ ...MONO, color: MUTED }}>
            Projects are created instantly and can be accessed from your dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
}