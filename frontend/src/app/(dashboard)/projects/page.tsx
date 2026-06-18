"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "@/src/store/slices/projectSlice";
import type { RootState, AppDispatch } from "@/src/store/store";

const EASE: [number, number, number, number] = [0.25, 0, 0, 1];

const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};
const INTER_TIGHT: React.CSSProperties = {
  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
};
const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};

const SECTION_BADGES = ["IDEA", "API", "DB", "FOLDER"] as const;

const MOCK_MEMBERS = [
  { initials: "JD", bg: "#ff3d00" },
  { initials: "AK", bg: "#6366f1" },
  { initials: "+3", bg: "#374151" },
];

function SectionBadges() {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {SECTION_BADGES.map((badge) => (
        <span
          key={badge}
          className="px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] border border-white/15 text-white/70 bg-transparent"
          style={INTER}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function MemberAvatars() {
  return (
    <div className="flex -space-x-2">
      {MOCK_MEMBERS.map((m, i) => (
        <div
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#10141d] text-[8px] font-bold text-white"
          style={{
            backgroundColor: m.bg,
            fontFamily: '"Inter", system-ui, sans-serif',
            zIndex: MOCK_MEMBERS.length - i,
          }}
        >
          {m.initials}
        </div>
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
    <div className="min-h-screen bg-[#06070c] pb-20 md:pb-0">
      <div className="max-w-[1100px] mx-auto px-5 md:px-8 lg:px-10">
        {/* Page header */}
        <div className="pt-10 md:pt-14">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-3"
            style={INTER}
          >
            Your Workspace
          </motion.p>

          <div className="flex items-center justify-between gap-4 mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, duration: 0.45, ease: EASE }}
              className="text-[2.6rem] md:text-[3.5rem] font-bold leading-none tracking-tight text-white"
              style={INTER_TIGHT}
            >
              Projects
            </motion.h1>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              type="button"
              onClick={() => router.push("/projects/create-project")}
              className="shrink-0 flex items-center gap-2 border border-white/20 px-4 py-2 text-[11px] font-semibold tracking-[0.08em] text-white hover:border-white/40 hover:bg-white/5 transition-all duration-150"
              style={INTER}
            >
              NEW PROJECT
              <span className="text-[#ff3d00] font-bold text-sm leading-none">
                +
              </span>
            </motion.button>
          </div>

          {/* Thin separator */}
          <div className="h-px w-full bg-white/8 mb-8" />
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border border-white/8 bg-[#10141d] p-6 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30"
              style={INTER}
            >
              No projects yet — create your first
            </p>
            <button
              type="button"
              onClick={() => router.push("/projects/create-project")}
              className="mt-5 inline-flex items-center gap-2 border border-[#ff3d00] px-5 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-[#ff3d00] hover:bg-[#ff3d00] hover:text-black transition-all duration-150"
              style={INTER}
            >
              <Plus size={12} strokeWidth={2} /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.45, ease: EASE }}
                className="group border border-white/8 bg-[#10141d] hover:border-white/20 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-200 flex flex-col"
              >
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  {/* Top row — name + kebab */}
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="text-[15px] font-semibold leading-snug text-white line-clamp-2"
                      style={INTER_TIGHT}
                    >
                      {String(project.name || "")}
                    </h3>
                    <button
                      type="button"
                      className="shrink-0 mt-0.5 text-white/25 hover:text-white/60 transition-colors duration-150"
                      aria-label="Project options"
                    >
                      <MoreVertical size={15} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Section badges */}
                  <SectionBadges />

                  {/* Description */}
                  <p
                    className="mt-4 text-[13px] leading-relaxed text-white/40 line-clamp-3 flex-1"
                    style={INTER}
                  >
                    {String(
                      (project as any).description ||
                        "No description provided.",
                    )}
                  </p>

                  {/* Card footer */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <p
                        className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25"
                        style={INTER}
                      >
                        Last edited 2h ago
                      </p>
                      <MemberAvatars />
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff3d00] hover:text-[#ff6030] transition-colors duration-150 whitespace-nowrap"
                      style={INTER}
                    >
                      Open Project
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — matches screenshot bottom section */}
      <footer className="mt-24 border-t border-white/5">
        <div className="max-w-[1100px] mx-auto px-5 md:px-8 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60"
              style={INTER}
            >
              Planex Architectural Systems
            </p>
            <p
              className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/20"
              style={INTER}
            >
              © 2024 All rights reserved
            </p>
          </div>
          <div className="flex gap-6">
            {["Documentation", "Privacy", "Terms"].map((item) => (
              <button
                key={item}
                type="button"
                className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 hover:text-white/60 transition-colors duration-150"
                style={INTER}
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
