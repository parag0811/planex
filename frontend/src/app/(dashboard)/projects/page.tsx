"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, Plus, Zap } from "lucide-react";
import Sidebar, {
  type SidebarPage,
} from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";

type ProjectRisk = "Low" | "Medium" | "High";

interface ProjectCard {
  id: string;
  name: string;
  description: string;
  risk: ProjectRisk;
  architecture: string;
  status: "active" | "draft";
}

const PROJECTS: ProjectCard[] = [
  {
    id: "proj-1",
    name: "E-commerce Backend",
    description:
      "Scalable Node.js infrastructure with integrated fraud detection and modular billing.",
    risk: "Low",
    architecture: "v3.2",
    status: "active",
  },
  {
    id: "proj-2",
    name: "Mobile Finance App",
    description:
      "Cross-platform React Native application focused on secure daily money workflows.",
    risk: "Medium",
    architecture: "v0.9",
    status: "draft",
  },
  {
    id: "proj-3",
    name: "Ops Command Center",
    description:
      "Internal platform for incident reporting, role-based approvals, and live audit views.",
    risk: "High",
    architecture: "v1.4",
    status: "active",
  },
];

const riskColorMap: Record<ProjectRisk, string> = {
  Low: "text-emerald-400",
  Medium: "text-amber-400",
  High: "text-rose-400",
};

export default function Projects() {
  const [activePage, setActivePage] = useState<SidebarPage>("overview");

  const activeCount = useMemo(
    () => PROJECTS.filter((project) => project.status === "active").length,
    [],
  );

  return (
    <div
      className="relative flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 15% 40%, #1e0e00 0%, #0c0702 45%, #080500 100%)",
        color: "#e0d5c5",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        projectName="Central Command"
        projectStatus="Online"
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <ProjectHeader projectName="Current Project" />

        <main className="px-4 pb-10 pt-5 md:px-7 md:pb-14 md:pt-7">
          <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-orange-500/65">
                Central Command
              </p>
              <h1 className="mt-1 text-3xl font-black uppercase leading-none text-orange-500 md:text-4xl">
                My Projects
              </h1>
            </div>

            <div className="w-fit rounded-xl border border-orange-500/20 bg-orange-500/8 px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                Active Instances
              </p>
              <p className="text-right text-xl font-bold text-orange-400">
                {activeCount}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PROJECTS.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.35 }}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 backdrop-blur-md"
              >
                <div className="relative mb-3 h-34 overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-br from-[#3b2f1f] via-[#15110b] to-[#080603]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,145,0,0.35),transparent_35%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_90%,rgba(66,32,0,0.4),transparent_48%)]" />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                      project.status === "active"
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-sky-500/18 text-sky-300"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold text-white/90">
                    {project.name}
                  </h2>
                  <button
                    aria-label={`Project menu for ${project.name}`}
                    className="rounded-md border border-white/[0.07] p-1.5 text-white/35 transition-colors hover:text-orange-400"
                  >
                    <MoreVertical size={15} />
                  </button>
                </div>

                <p className="mt-2 min-h-12 text-sm leading-relaxed text-white/48">
                  {project.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30">
                      ML Risk
                    </p>
                    <p
                      className={`text-sm font-bold ${riskColorMap[project.risk]}`}
                    >
                      {project.risk}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30">
                      Architecture
                    </p>
                    <p className="text-sm font-bold text-white/75">
                      {project.architecture}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * PROJECTS.length, duration: 0.35 }}
              className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-dashed border-orange-500/35 bg-orange-500/[0.04] p-5"
            >
              <div>
                <div className="mb-4 inline-flex rounded-full border border-orange-500/35 bg-orange-500/15 p-2.5 text-orange-400">
                  <Plus size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white/88">
                  Create New Project
                </h3>
                <p className="mt-2 max-w-xs text-sm text-white/45">
                  Initialize a new AI-architected foundation and launch your
                  next product line.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#111]/45 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                  Credits Remaining
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-3xl font-black text-orange-400">1,240</p>
                  <div className="rounded-lg bg-sky-500/20 p-2 text-sky-300">
                    <Zap size={16} />
                  </div>
                </div>
              </div>
            </motion.article>
          </section>

          <section className="mt-10 rounded-3xl border border-white/[0.08] bg-[linear-gradient(120deg,rgba(255,138,0,0.1),rgba(0,0,0,0.15))] px-6 py-10 text-center md:mt-14">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/12 text-orange-400">
              <Zap size={22} />
            </div>
            <h2 className="text-4xl font-black uppercase leading-none text-orange-500 md:text-6xl">
              Forge Your Vision
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/50 md:text-base">
              Architect confidently, manage risk early, and convert ideas into
              structured products.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
