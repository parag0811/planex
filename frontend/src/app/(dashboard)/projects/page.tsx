"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import Header from "@/src/components/layout/Header";
import { fetchProjects } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

interface ProjectCard {
  id: string;
  name: string;
  status: "active" | "draft";
}

const buildProjectCard = (
  project: { id: string; name: string },
  index: number,
): ProjectCard => {
  return {
    id: project.id,
    name: project.name,
    status: index % 3 === 1 ? "draft" : "active",
  };
};

export default function Projects() {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, fetch } = useSelector((state: RootState) => state.project);

  useEffect(() => {
    void dispatch(fetchProjects());
  }, [dispatch]);

  const projectCards = useMemo(
    () => projects.map((project, index) => buildProjectCard(project, index)),
    [projects],
  );

  const activeCount = projectCards.length;

  return (
    <div
      className="min-h-screen bg-[#1a1200] text-white"
      style={{
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <Header />

      <main className="relative overflow-hidden px-4 pb-10 pt-20 md:px-7 md:pb-14">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 mx-auto max-w-330">
          <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-orange-500/65">
                Active projects
              </p>
              <h1 className="mt-1 text-3xl font-black uppercase leading-none text-orange-500 md:text-4xl">
                Projects
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
            {fetch.loading && projectCards.length === 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/2 p-5 text-sm text-white/45 md:col-span-2 xl:col-span-3">
                Loading projects...
              </div>
            )}

            {!fetch.loading && projectCards.length === 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/2 p-5 text-sm text-white/45 md:col-span-2 xl:col-span-3">
                No projects found.
              </div>
            )}

            {projectCards.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.35 }}
                className="group relative rounded-2xl border border-white/8 bg-white/2 p-3 backdrop-blur-md"
              >
                <div className="flex min-h-34 items-end rounded-xl border border-white/8 bg-[#130b02] p-4">
                  <span
                    className={`absolute right-5 top-5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                      project.status === "active"
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-sky-500/18 text-sky-300"
                    }`}
                  >
                    {project.status}
                  </span>
                  <div className="w-full">
                    <h2 className="text-xl font-bold text-white/90">
                      {project.name}
                    </h2>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/30">
                        Modified recently
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-orange-400 transition-colors hover:text-orange-300"
                      >
                        Resume
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * projectCards.length, duration: 0.35 }}
              className="flex min-h-80 flex-col justify-between rounded-2xl border border-dashed border-orange-500/35 bg-orange-500/4 p-5"
            >
              <div>
                <div className="mb-4 inline-flex rounded-full border border-orange-500/35 bg-orange-500/15 p-2.5 text-orange-400">
                  <Plus size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white/88">
                  Create New Project
                </h3>
                <p className="mt-2 max-w-xs text-sm text-white/45">
                  Start a new project workspace.
                </p>
              </div>
              <Link
                href="/projects/create-project"
                className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-orange-400"
              >
                Create
              </Link>
            </motion.article>
          </section>
        </div>
      </main>
    </div>
  );
}
