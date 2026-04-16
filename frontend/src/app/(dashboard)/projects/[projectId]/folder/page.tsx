"use client";

import { motion } from "framer-motion";
import { FolderTree, FolderOpen, FileCode2, Sparkles } from "lucide-react";

const structure = [
  { label: "src", detail: "Application source root" },
  { label: "components", detail: "Reusable UI and layout primitives" },
  { label: "modules", detail: "Feature-specific logic and workflows" },
  { label: "services", detail: "API clients and data access" },
];

export default function FolderPage() {
  return (
    <main className="flex-1 min-w-0 px-7 py-8" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-orange-500/65">
          Folder
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none text-orange-500">
          Structure planning
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          Keep the project tree predictable and easy to scan. This section is
          for workspace scaffolding, not product content.
        </p>
      </motion.div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {structure.map((item, index) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <FolderOpen size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">{item.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {item.detail}
            </p>
          </motion.article>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/2 p-6">
        <div className="flex items-center gap-2 text-orange-400">
          <FileCode2 size={16} />
          <p className="text-[11px] uppercase tracking-[0.2em]">Scaffold hint</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/40">
          Group route files, components, and generated assets so the project
          shell stays easy to maintain.
        </p>
      </section>
    </main>
  );
}
