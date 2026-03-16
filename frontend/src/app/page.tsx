"use client";

import { motion, Variants } from "framer-motion";
import {
  Plus,
  Play,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Code2,
  Database,
  FolderTree,
} from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const recentProjects = [
  {
    id: 1,
    title: "E-commerce Backend",
    tags: ["RESTful API", "PostgreSQL Schema"],
    edited: "2H AGO",
    active: true,
    color: "#1e3a3a",
  },
  {
    id: 2,
    title: "Mobile Finance App",
    tags: ["Clean Architecture", "GraphQL"],
    edited: "3H AGO",
    active: false,
    color: "#1e2a3a",
  },
  {
    id: 3,
    title: "AI Chat Integration",
    tags: ["LLM Pipeline", "Vector DB"],
    edited: "1D AGO",
    active: false,
    color: "#1a1200",
  },
];

const features = [
  {
    icon: <Code2 size={22} className="text-[#f97316]" />,
    title: "API Architect",
    desc: "Define REST, GraphQL, or gRPC endpoints with automated documentation and mockup generation.",
  },
  {
    icon: <Database size={22} className="text-[#f97316]" />,
    title: "Schema Designer",
    desc: "Visual entity modeling with AI-driven normalization and instant SQL or Prisma schema export.",
  },
  {
    icon: <FolderTree size={22} className="text-[#f97316]" />,
    title: "Folder Scaffolding",
    desc: "Generate boilerplate directory structures based on popular frameworks like Next.js, Go, or NestJS.",
  },
  {
    icon: <ShieldCheck size={22} className="text-[#f97316]" />,
    title: "ML Risk Guard",
    desc: "Proactive identification of security vulnerabilities and performance bottlenecks using ML models.",
  },
];

// ease must be typed as a const tuple, not number[]
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// instead of a function variant (which TS rejects), use a factory
// that returns a fully-resolved Variants object per index
const makeFadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a1200] text-white font-sans">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            {/* Badge */}
            <motion.div
              variants={makeFadeUp(0)}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
              <span className="text-xs font-semibold text-[#a89880] tracking-widest uppercase">
                V2.0 NOW LIVE
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={makeFadeUp(1)}
              className="text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              Architect Your
              <br />
              Vision with <span className="text-[#f97316]">AI</span>
              <br />
              <span className="text-[#f97316]">Precision</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={makeFadeUp(2)}
              className="text-[#a89880] text-base leading-relaxed max-w-md mb-10"
            >
              The ultimate AI-powered workspace for developers. Define APIs, model DB schemas, and
              scaffold structures with integrated ML risk analysis.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={makeFadeUp(3)}
              className="flex items-center gap-4 flex-wrap"
            >
              <button className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-black font-bold text-sm px-6 py-3 rounded-full transition-all hover:scale-[1.03]">
                <Plus size={16} />
                Create New Project
              </button>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all">
                <Play size={14} className="fill-white" />
                Watch Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Right — Code Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] aspect-[4/3]">
              <div className="absolute inset-0 p-5">
                {/* Traffic lights */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                {/* Simulated code lines */}
                <div className="space-y-2">
                  {(
                    [
                      ["text-[#f97316]", "w-24"],
                      ["text-[#4ade80]", "w-48"],
                      ["text-[#60a5fa]", "w-36"],
                      ["text-white/30", "w-56"],
                      ["text-[#f97316]", "w-20"],
                      ["text-[#4ade80]", "w-64"],
                      ["text-white/30", "w-44"],
                      ["text-[#60a5fa]", "w-32"],
                      ["text-white/30", "w-52"],
                      ["text-[#f97316]", "w-40"],
                      ["text-[#4ade80]", "w-28"],
                      ["text-white/20", "w-60"],
                    ] as [string, string][]
                  ).map(([color, width], i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className={`h-2 rounded-full ${color} bg-current ${width}`}
                    />
                  ))}
                </div>
              </div>

              {/* Overlay glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1200]/80 via-transparent to-transparent" />

              {/* ML Risk badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-5 left-5 flex items-center gap-3 bg-[#1a1200]/90 border border-[#f97316]/30 rounded-xl px-4 py-3 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-[#f97316]/20 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-[#f97316]" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">ML Risk Engine Active</p>
                  <p className="text-[#f97316] text-xs">98% Architecture Security Score</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── RECENT PROJECTS ──────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} className="text-[#f97316]" />
            <h2 className="text-xl font-bold text-white">Recent Projects</h2>
          </motion.div>
          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            href="#"
            className="text-sm text-[#f97316] hover:underline"
          >
            View All Projects
          </motion.a>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {recentProjects.map((project, i) => (
            <motion.div
              key={project.id}
              variants={makeFadeUp(i)}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative bg-[#1e1600] border border-white/8 rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Thumbnail */}
              <div
                className="h-40 w-full relative"
                style={{ backgroundColor: project.color }}
              >
                <div className="absolute inset-0 flex items-end justify-center gap-1 px-6 pb-4 pt-8">
                  {[40, 65, 45, 80, 55, 70, 50, 90, 60].map((h, j) => (
                    <motion.div
                      key={j}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.05, duration: 0.4 }}
                      style={{ height: `${h}%` }}
                      className="w-full rounded-t bg-[#f97316]/30 group-hover:bg-[#f97316]/50 transition-colors origin-bottom"
                    />
                  ))}
                </div>
                {project.active && (
                  <div className="absolute top-3 right-3 bg-[#f97316] text-black text-[10px] font-bold px-2 py-0.5 rounded">
                    ACTIVE
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex items-end justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{project.title}</h3>
                  <p className="text-[#6b5c4c] text-xs">{project.tags.join(" • ")}</p>
                  <p className="text-[#4a3a2a] text-[10px] mt-2 uppercase tracking-wider font-medium">
                    Edited {project.edited}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#f97316]/50 group-hover:bg-[#f97316]/10 transition-all">
                  <ArrowRight
                    size={14}
                    className="text-[#6b5c4c] group-hover:text-[#f97316] transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CORE ENGINE ──────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-[#f97316] text-xs font-bold uppercase tracking-widest mb-3">
            Core Engine
          </p>
          <h2 className="text-4xl font-extrabold text-white leading-tight max-w-lg">
            Engineered for the Modern Developer Workflow
          </h2>
          <p className="text-[#a89880] text-sm mt-4 max-w-xl leading-relaxed">
            Comprehensive tools to transition from conceptual spark to production-ready architecture
            in record time.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={makeFadeUp(i)}
              whileHover={{ y: -4, borderColor: "rgba(249,115,22,0.3)" }}
              className="bg-[#1e1600] border border-white/8 rounded-2xl p-6 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center mb-5 group-hover:bg-[#f97316]/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-[#6b5c4c] text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="bg-[#f97316] rounded-3xl px-10 py-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
            <div className="absolute top-4 left-8 text-[120px] font-black text-black leading-none">
              &lt;/&gt;
            </div>
          </div>

          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl lg:text-5xl font-extrabold text-black mb-4 leading-tight"
            >
              Ready to build the future?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-black/70 text-sm mb-10 max-w-md mx-auto"
            >
              Join 50,000+ developers who are planning their next big thing with Planex AI.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <button className="bg-black text-white font-bold text-sm px-8 py-3.5 rounded-full hover:bg-[#1a1200] transition-all hover:scale-[1.03]">
                Start Free Project
              </button>
              <button className="bg-transparent border-2 border-black text-black font-bold text-sm px-8 py-3.5 rounded-full hover:bg-black/10 transition-all">
                Enterprise Solutions
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}