"use client";

import { motion } from "framer-motion";
import { Database, Layers3, ShieldCheck, Sparkles } from "lucide-react";

const cards = [
  {
    title: "Core entities",
    description: "Define users, projects, members, and any supporting documents in one place.",
    icon: Database,
  },
  {
    title: "Relationships",
    description: "Map one-to-many and many-to-many links before the schema becomes hard to change.",
    icon: Layers3,
  },
  {
    title: "Guardrails",
    description: "Track indexes, constraints, and validation rules alongside the model.",
    icon: ShieldCheck,
  },
];

export default function DatabasePage() {
  return (
    <main className="flex-1 min-w-0 px-7 py-8" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-orange-500/65">
          Database
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none text-orange-500">
          Schema design
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
          Shape the data model for this project niche. Keep it focused on the
          entities and relationships that drive the product.
        </p>
      </motion.div>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="rounded-2xl border border-white/8 bg-white/3 p-5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                <Icon size={18} />
              </div>
              <h2 className="text-lg font-bold text-white">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                {card.description}
              </p>
            </motion.article>
          );
        })}
      </section>

      <section className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/2 p-6">
        <div className="flex items-center gap-2 text-orange-400">
          <Sparkles size={16} />
          <p className="text-[11px] uppercase tracking-[0.2em]">AI prompt area</p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/40">
          Use this page to refine the database structure for the active project.
          The project sidebar stays available here because this route is inside
          the project shell.
        </p>
      </section>
    </main>
  );
}
