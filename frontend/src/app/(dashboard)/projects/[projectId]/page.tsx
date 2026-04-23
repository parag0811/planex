"use client";

import { motion } from "framer-motion";
import { Copy, TriangleAlert } from "lucide-react";

const stats = [
  { label: "Cluster Uptime", value: "99.982%" },
  { label: "Avg Latency", value: "14.2ms" },
  { label: "Node Count", value: "2,048" },
];

const teamMembers = [
  { name: "Alex Chen", role: "Lead Architect" },
  { name: "Sarah Miller", role: "Lead Backend" },
];

const riskItems = [
  "Schema circular dependency detected in auth_module_v3. Potential infinite traversal.",
  "Potential latency bottleneck in Node_04 during peak serialization.",
  "Insufficient GPU memory overhead for Epoch_12 validation run.",
];

export default function ProjectOverviewPage() {
  return (
    <main
      className="flex-1 min-w-0 overflow-y-auto bg-[#05070d] px-4 py-5 md:px-7 md:py-7"
      style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em]">
          <span className="text-[#586177]">PLANEX</span>
          <span className="text-[#303646]">&gt;</span>
          <span className="text-[#8791a6]">PROJECT AETHER</span>
          <span className="text-[#303646]">&gt;</span>
          <span className="text-orange-500">DASHBOARD</span>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-md border border-white/5 bg-[#0a0d16]/85 p-4 md:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold text-white md:text-3xl">Project Aether</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8f98ad]">
                Decentralized high-performance computing layer designed for massive
                parallelized LLM training clusters. Orchestrating cold-storage data
                pipelines with real-time semantic indexing.
              </p>
            </div>

            <div className="rounded-sm border border-green-500/40 bg-green-500/8 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-green-400">
              System_Health:
              <div>Stable</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.article
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                className="rounded-sm border border-white/5 bg-black/35 p-4"
              >
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#6f778a]">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.28 }}
          >
            <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#5c6579]">
              Infrastructure Team
            </p>

            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-sm border border-white/6 bg-[#0c0f18] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-sm bg-white/10 text-[10px] font-bold text-white">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <p className="text-[11px] text-[#8590a7]">{member.role}</p>
                    </div>
                  </div>
                  <button className="text-[#5d667a] transition-colors hover:text-orange-500">X</button>
                </div>
              ))}

              <button
                type="button"
                className="w-full rounded-sm border border-dashed border-white/12 bg-[#080a12] p-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f778b] transition-colors hover:border-orange-500/35 hover:text-orange-400"
              >
                + Add Member
              </button>
            </div>
          </motion.article>

          <div className="space-y-5">
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.28 }}
            >
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#5c6579]">
                Project Access
              </p>

              <div className="rounded-sm border border-white/6 bg-[#0c0f18] p-4">
                <p className="text-[8px] uppercase tracking-[0.2em] text-[#6b7388]">Global Invite URL</p>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-sm border border-white/8 bg-[#060911] px-3 py-2">
                  <span className="truncate text-[11px] text-[#c5cde1]">https://aether.os/auth/</span>
                  <button className="inline-flex items-center gap-1 rounded-sm bg-white px-2 py-1 text-[10px] font-bold text-[#0b1020] transition-colors hover:bg-orange-100">
                    <Copy size={11} />
                    Copy
                  </button>
                </div>
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.28 }}
            >
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#5c6579]">
                ML Risk Diagnostics
              </p>

              <div className="rounded-sm border border-orange-500/30 bg-[#130d08] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-orange-200">
                    <TriangleAlert size={13} className="text-orange-500" />
                    Risk Level
                  </p>
                  <span className="rounded-sm border border-orange-500/35 bg-orange-500/12 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-orange-400">
                    Medium_Threat
                  </span>
                </div>

                <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-orange-100/95">
                  {riskItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 text-orange-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          </div>
        </section>
      </div>
    </main>
  );
}
