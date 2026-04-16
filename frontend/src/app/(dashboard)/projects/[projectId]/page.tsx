"use client";

import { motion } from "framer-motion";
import { Boxes, LayoutDashboard, AlertCircle, Clock, Zap } from "lucide-react";

const stats = [
  { label: "Modules", value: "12", icon: Boxes },
  { label: "Milestones", value: "4", icon: LayoutDashboard },
  { label: "Risks", value: "2", icon: AlertCircle },
  { label: "Updated", value: "Now", icon: Clock },
];

const highlights = [
  "Project scope is locked and ready for section planning.",
  "Use the sidebar to move between idea, database, API, and folder views.",
  "This overview stays lightweight and keeps the project shell focused.",
];

export default function ProjectOverviewPage() {
  return (
    <main
      className="flex-1 min-w-0 px-7 py-8"
      style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-orange-500/65">
            Project overview
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none text-orange-500">
            Project Obsidian
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
            A compact workspace summary for the active project. The project
            shell handles the side navigation, while this page stays as a clean
            landing surface.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-orange-400">
          <Zap size={14} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
            Active project
          </span>
        </div>
      </motion.div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
              className="rounded-2xl border border-white/6 bg-white/3 p-5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                <Icon size={18} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
            </motion.article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="rounded-3xl border border-white/6 bg-white/3 p-6"
        >
          <h2 className="text-xl font-bold text-white">Quick summary</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/45">
            {highlights.map((item) => (
              <li key={item} className="rounded-xl border border-white/6 bg-black/15 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </motion.article>

        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
          className="rounded-3xl border border-dashed border-white/8 bg-white/2 p-6"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-orange-500/65">
            Next step
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none text-orange-500">
            Pick a section
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/40">
            Open Idea, Database, API, or Folder from the sidebar to continue the
            project workflow.
          </p>
        </motion.aside>
      </section>
    </main>
  );
}
