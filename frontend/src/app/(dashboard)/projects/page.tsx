"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "@/src/store/slices/projectSlice";
import type { RootState, AppDispatch } from "@/src/store/store";

// ─── Design tokens — identical to Idea / Overview pages ──────────────────────
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number) => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: EASE },
  },
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const SECTION_BADGES = ["IDEA", "API", "DB", "FOLDER"] as const;

function SectionBadges() {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {SECTION_BADGES.map((badge) => (
        <span
          key={badge}
          className="border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{ ...MONO, borderColor: BORDER, color: MUTED }}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading } = useSelector(
    (state: RootState) => state.project,
  );
  const [searchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [projects, searchTerm],
  );

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ ...INTER, backgroundColor: BG }}
    >
      {/* ── Main content ── */}
      <div className="flex-1">
        <motion.div
          className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Breadcrumb */}
          <motion.div variants={fadeUp(0)} className="mb-3">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ ...MONO, color: ACCENT }}
            >
              Workspace // Projects
            </p>
          </motion.div>

          {/* Header row */}
          <motion.div
            variants={fadeUp(1)}
            className="mb-10 flex items-center justify-between gap-4"
          >
            <h1
              className="text-[3.4rem] sm:text-[4.2rem] md:text-[5rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
              style={INTER_TIGHT}
            >
              Projects
            </h1>

            <button
              type="button"
              onClick={() => router.push("/projects/create-project")}
              className="flex shrink-0 cursor-pointer items-center gap-2 border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition"
              style={{
                ...MONO,
                borderColor: ACCENT,
                color: ACCENT,
                backgroundColor: `${ACCENT}12`,
              }}
            >
              <Plus size={13} />
              New Project
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp(2)} className="mb-10">
            <div className="h-px w-full" style={{ backgroundColor: BORDER }} />
          </motion.div>

          {/* Projects grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse border p-6"
                  style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              variants={fadeUp(3)}
              className="border border-dashed p-16 text-center"
              style={{ borderColor: BORDER }}
            >
              <p className="text-base" style={{ ...INTER, color: MUTED }}>
                No projects yet. Create your first to get started.
              </p>
              <button
                type="button"
                onClick={() => router.push("/projects/create-project")}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Plus size={13} />
                Create Project
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.4, ease: EASE }}
                  className="group flex flex-col border transition-colors duration-200"
                  style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${ACCENT}40`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
                >
                  <div className="flex flex-1 flex-col p-6">
                    {/* Top row — name + kebab */}
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="line-clamp-2 text-lg font-bold leading-snug text-white"
                        style={INTER_TIGHT}
                      >
                        {String(project.name || "")}
                      </h3>
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 transition-colors hover:text-white"
                        style={{ color: MUTED }}
                        aria-label="Project options"
                      >
                        <MoreVertical size={15} strokeWidth={1.5} />
                      </button>
                    </div>

                    <SectionBadges />

                    {/* Description */}
                    <p
                      className="mt-4 flex-1 text-sm leading-relaxed line-clamp-3"
                      style={{ ...INTER, color: MUTED }}
                    >
                      {String(
                        (project as any).description ||
                        "No description provided.",
                      )}
                    </p>

                    {/* Card footer */}
                    <div
                      className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
                      style={{ borderColor: BORDER }}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
                        style={{ ...MONO, color: ACCENT }}
                      >
                        Open Project →
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Fixed-at-bottom footer (inside page, not overlay) ── */}
      <footer className="border-t" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start justify-between gap-4 px-5 py-6 sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-white"
              style={MONO}
            >
              Planex
            </p>
            <p
              className="mt-1 text-[10px] uppercase tracking-[0.1em]"
              style={{ ...MONO, color: MUTED }}
            >
              © 2026 All rights reserved
            </p>
          </div>
          <div className="flex gap-5">
            {["Documentation", "Privacy", "Terms"].map((item) => (
              <button
                key={item}
                type="button"
                className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
                style={{ ...MONO, color: MUTED }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}