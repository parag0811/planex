"use client";

import { useEffect, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
  Plus,
  ArrowRight,
  RotateCcw,
  Database,
  FolderTree,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { fetchProjects, setCurrentProject } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

type ProjectPreview = {
  id: string;
  title: string;
  tags: string[];
  edited: string;
  active: boolean;
};

const EASE: [number, number, number, number] = [0.25, 0, 0, 1];

const makeFadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: EASE },
  },
});

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const coreFeatures = [
  {
    icon: <Zap size={20} strokeWidth={1.5} className="text-[#ff3d00]" />,
    label: "API Schematics",
    desc: "Design REST endpoints with full request/response schemas, WebSocket events, and auth flows before writing a single line of code.",
  },
  {
    icon: <Database size={20} strokeWidth={1.5} className="text-[#ff3d00]" />,
    label: "DB Modeling",
    desc: "Define entities, fields, relationships, and indexes. Visualize your data model and export production-ready SQL migrations instantly.",
  },
  {
    icon: <FolderTree size={20} strokeWidth={1.5} className="text-[#ff3d00]" />,
    label: "Folder Scaffolding",
    desc: "Generate boilerplate directory structures for any framework — Next.js, NestJS, Go, or custom. Scaffold the right architecture instantly.",
  },
];

const stats = [
  { value: "140K+", label: "Architects" },
  { value: "2.4M", label: "Diagrams" },
  { value: "99.9%", label: "Uptime" },
  { value: "12s", label: "Avg Gen Time" },
];

const buildProjectPreviews = (
  projects: Array<{ id: string; name: string; owner_id?: string }>,
): ProjectPreview[] =>
  projects.slice(0, 3).map((project, index) => ({
    id: project.id,
    title: project.name,
    tags: [
      index === 0 ? "Continue building" : "Recent workspace",
      project.owner_id ? "Owned" : "Shared",
    ],
    edited: index === 0 ? "JUST NOW" : `${index + 1}D AGO`,
    active: index === 0,
  }));

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`,
        opacity: 1,
      }}
    />
  );
}

function StatsStrip() {
  return (
    <div className="border-t border-b border-[#262626] bg-[#0a0a0a]">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: EASE }}
            className={[
              "py-10 px-8 md:px-12",
              i < stats.length - 1 ? "border-r border-[#262626]" : "",
              i === 1 ? "border-r-0 md:border-r" : "",
            ].join(" ")}
          >
            <p
              className="text-5xl md:text-6xl font-bold text-[#fafafa] leading-none tracking-[-0.04em]"
              style={{
                fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
              }}
            >
              {stat.value}
            </p>
            <p
              className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#737373]"
              style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
            >
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section
      className="bg-[#0a0a0a] border-t border-[#262626]"
      id="core-engine"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-20 pb-20 md:pb-28">
        <div className="mb-16 grid lg:grid-cols-[1fr_auto] lg:items-end gap-8">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mb-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#ff3d00]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Core Engine
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05, duration: 0.5, ease: EASE }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-[-0.04em] text-[#fafafa]"
              style={{
                fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
              }}
            >
              PLAN EVERY LAYER
              <br />
              OF YOUR STACK
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex items-start gap-3 max-w-xs lg:pb-1"
          >
            <span className="mt-1 shrink-0 w-px h-10 bg-[#ff3d00]" />
            <p className="text-sm leading-relaxed text-[#737373]">
              Comprehensive toolsets for the modern engineer. From high-level
              whiteboards to low-level schema definitions.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 gap-px bg-[#262626] sm:grid-cols-3"
        >
          {coreFeatures.map((feature, index) => (
            <motion.div
              key={feature.label}
              variants={makeFadeUp(index)}
              className="group bg-[#0f0f0f] p-8 hover:bg-[#1a1a1a] transition-colors duration-150 cursor-default"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center border border-[#262626] group-hover:border-[#ff3d00]/30 transition-colors duration-150">
                {feature.icon}
              </div>
              <p
                className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#fafafa]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {feature.label}
              </p>
              <p className="text-[13px] leading-relaxed text-[#737373]">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-[#fafafa] border-t border-[#e5e5e5]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-[-0.05em] text-[#0a0a0a]"
              style={{
                fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
              }}
            >
              STOP PLANNING
              <br />
              IN YOUR HEAD.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[#737373] max-w-sm">
              Join 140,000+ lead engineers building reliable systems through
              deliberate planning and architectural rigor.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
            className="space-y-3 max-w-sm"
          >
            <input
              type="email"
              placeholder="ENTER YOUR WORK EMAIL"
              className="w-full border border-[#0a0a0a] bg-transparent px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#0a0a0a] placeholder-[#aaaaaa] outline-none focus:border-[#ff3d00] transition-colors duration-150"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            />
            <Link
              href="/register"
              className="flex w-full items-center justify-center bg-[#0a0a0a] px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#fafafa] hover:bg-[#ff3d00] transition-colors duration-150"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Get Access Now
            </Link>
            <p
              className="text-[9px] text-[#aaaaaa] tracking-[0.08em] uppercase"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              * No credit card required. 14-day free trial.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroStatusPanel() {
  return (
    <div className="hidden lg:block border-l border-[#262626] pl-12 xl:pl-16">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
        className="space-y-8 pt-4"
      >
        <div>
          <p
            className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff3d00]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Current Version
          </p>
          <p
            className="text-2xl font-semibold text-[#fafafa] tracking-[-0.01em]"
            style={{
              fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
            }}
          >
            v1.0 "PLANEX"
          </p>
        </div>

        <div className="border-t border-[#262626]" />

        <div>
          <p
            className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff3d00]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Status
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <p
              className="text-sm font-semibold text-[#fafafa]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              LIVE STABLE
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GuestLanding() {
  return (
    <>
      <section className="pt-28 pb-0 md:pt-36">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid lg:grid-cols-[1fr_auto] gap-0 items-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="pr-0 lg:pr-12 xl:pr-16"
            >
              <motion.p
                variants={makeFadeUp(0)}
                className="mb-6 text-[12px] font-bold uppercase tracking-[0.22em] text-[#ff3d00]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Collaborative Technical Planning
              </motion.p>

              <motion.h1
                variants={makeFadeUp(1)}
                className="text-[clamp(2.6rem,6.5vw,6rem)] font-bold leading-[1.02] tracking-[-0.05em] text-[#fafafa]"
                style={{
                  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
                }}
              >
                DESIGN YOUR
                <br />
                SYSTEM.
                <br />
                <span className="text-[#ff3d00]">BEFORE YOU</span>
                <br />
                <span className="text-[#ff3d00]">BUILD IT.</span>
              </motion.h1>

              <motion.p
                variants={makeFadeUp(2)}
                className="mt-8 max-w-lg text-base md:text-lg leading-relaxed text-[#c09292]"
              >
                Generate APIs, model your database, and structure your codebase
                with architectural precision. The standard for technical lead
                infrastructure design.
              </motion.p>

              <motion.div
                variants={makeFadeUp(3)}
                className="mt-10 flex flex-wrap items-center gap-6"
              >
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2.5 text-[#ff3d00] font-semibold text-[13px] uppercase tracking-[0.12em] py-2 overflow-hidden"
                >
                  Start Building
                </Link>

                <Link
                  href="#core-engine"
                  className="inline-flex items-center gap-2 border border-[#fafafa] px-6 py-3 text-[13px] font-bold uppercase tracking-[0.1em] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] transition-all duration-150"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  View Demo
                </Link>
              </motion.div>
            </motion.div>

            <HeroStatusPanel />
          </div>
        </div>
      </section>

      <div className="mt-20 md:mt-24">
        <StatsStrip />
      </div>

      <section id="core-engine">
        <FeaturesSection />
      </section>

      <CtaBanner />
    </>
  );
}

function LoggedInLanding({
  displayName,
  projectCards,
  loadingProjects,
  onProjectClick,
}: {
  displayName: string;
  projectCards: ProjectPreview[];
  loadingProjects: boolean;
  onProjectClick: (id: string) => void;
}) {
  return (
    <>
      <section className="pt-28 pb-0 md:pt-36">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid lg:grid-cols-[1fr_auto] gap-0 items-start">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="pr-0 lg:pr-12 xl:pr-16"
            >
              <motion.p
                variants={makeFadeUp(0)}
                className="mb-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff3d00]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Welcome back, {displayName}
              </motion.p>

              <motion.h1
                variants={makeFadeUp(1)}
                className="text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-none tracking-[-0.05em] text-[#fafafa]"
                style={{
                  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
                }}
              >
                CONTINUE WHERE
                <br />
                <span className="text-[#ff3d00]">YOU LEFT OFF.</span>
              </motion.h1>

              <motion.p
                variants={makeFadeUp(2)}
                className="mt-8 max-w-lg text-base md:text-lg leading-relaxed text-[#737373]"
              >
                Open a workspace, review recent activity, or launch a new
                project.
              </motion.p>

              <motion.div
                variants={makeFadeUp(3)}
                className="mt-10 flex flex-wrap items-center gap-6"
              >
                <Link
                  href="/projects"
                  className="group relative inline-flex items-center gap-2.5 text-[#ff3d00] font-bold text-[13px] uppercase tracking-[0.12em] py-2 overflow-hidden"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Go to Projects
                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    className="transition-transform duration-150 group-hover:translate-x-1"
                  />
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-[#ff3d00] scale-x-100 transition-transform duration-150 group-hover:scale-x-110" />
                </Link>

                <Link
                  href="/projects/create-project"
                  className="inline-flex items-center gap-2 border border-[#fafafa] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] transition-all duration-150"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  <Plus size={12} strokeWidth={1.5} />
                  New Project
                </Link>
              </motion.div>

              <motion.div
                variants={makeFadeUp(4)}
                className="mt-12 grid grid-cols-3 gap-px bg-[#262626] max-w-md"
              >
                {[
                  { label: "Projects", value: String(projectCards.length) },
                  {
                    label: "Recent",
                    value: String(Math.min(3, projectCards.length)),
                  },
                  { label: "Mode", value: "Active", accent: true },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0a0a0a] p-5">
                    <p
                      className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#737373]"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`mt-2 text-3xl font-black leading-none tracking-[-0.04em] ${item.accent ? "text-[#ff3d00]" : "text-[#fafafa]"}`}
                      style={{
                        fontFamily:
                          '"Inter Tight", "Inter", system-ui, sans-serif',
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <HeroStatusPanel />
          </div>
        </div>
      </section>

      <div className="mt-20 md:mt-24">
        <StatsStrip />
      </div>

      <section className="py-20 md:py-28 bg-[#0a0a0a] border-t border-[#262626]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RotateCcw
                size={15}
                strokeWidth={1.5}
                className="text-[#ff3d00]"
              />
              <h2
                className="text-xl font-black tracking-[-0.03em] text-[#fafafa]"
                style={{
                  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
                }}
              >
                Recent Projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="group relative text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff3d00] pb-1"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              All projects
              <span className="absolute bottom-0 left-0 h-px w-full origin-left bg-[#ff3d00] scale-x-100 transition-transform duration-150 group-hover:scale-x-110" />
            </Link>
          </div>

          {loadingProjects ? (
            <div
              className="border border-[#262626] px-6 py-5 text-[11px] text-[#737373]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Loading projects...
            </div>
          ) : projectCards.length === 0 ? (
            <div className="border border-dashed border-[#262626] px-6 py-16 text-center">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#737373]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                No projects yet
              </p>
              <p className="mt-2 text-sm text-[#737373]">
                Create your first project to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {projectCards.map((project, index) => (
                <motion.div
                  key={project.id}
                  onClick={() => onProjectClick(project.id)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.07,
                    duration: 0.45,
                    ease: EASE,
                  }}
                  className="group bg-[#0a0a0a] border border-[#262626] hover:bg-[#1a1a1a] transition-colors duration-150 cursor-pointer"
                >
                  <div className="relative h-32 border-b border-[#262626] px-6 flex items-end gap-1 pb-4">
                    {[40, 65, 45, 80, 55, 70, 50, 90, 60].map(
                      (height, barIndex) => (
                        <motion.div
                          key={barIndex}
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.3 + barIndex * 0.04,
                            duration: 0.35,
                          }}
                          style={{ height: `${height}%` }}
                          className="w-full origin-bottom bg-[#ff3d00]/20 group-hover:bg-[#ff3d00]/40 transition-colors duration-150"
                        />
                      ),
                    )}
                    {project.active && (
                      <div
                        className="absolute right-4 top-4 bg-[#ff3d00] px-2 py-0.5 text-[9px] font-bold text-[#0a0a0a]"
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          letterSpacing: "0.1em",
                        }}
                      >
                        ACTIVE
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between p-5">
                    <div>
                      <h3
                        className="mb-1 text-sm font-bold text-[#fafafa] tracking-[-0.01em]"
                        style={{
                          fontFamily:
                            '"Inter Tight", "Inter", system-ui, sans-serif',
                        }}
                      >
                        {project.title}
                      </h3>
                      <p
                        className="text-[10px] text-[#737373]"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {project.tags.join(" · ")}
                      </p>
                      <p
                        className="mt-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#737373]/60"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        Edited {project.edited}
                      </p>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center border border-[#262626] group-hover:border-[#ff3d00]/50 transition-colors duration-150">
                      <ArrowRight
                        size={12}
                        strokeWidth={1.5}
                        className="text-[#737373] group-hover:text-[#ff3d00] transition-colors duration-150"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuth, authCheckLoading: loading, token, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const { projects, fetch } = useSelector((state: RootState) => state.project);

  const authPending = Boolean(token) && loading && !isAuth;

  useEffect(() => {
    if (isAuth) {
      void dispatch(fetchProjects());
    }
  }, [dispatch, isAuth]);

  const projectCards = useMemo(
    () => buildProjectPreviews(projects),
    [projects],
  );

  const handleProjectClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      dispatch(setCurrentProject(project as any));
      router.push(`/projects/${projectId}`);
    }
  };

  if (authPending) {
    return (
      <div
        className="min-h-screen bg-[#0a0a0a] text-[#fafafa]"
        style={{ fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif' }}
      >
        <Header />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 pt-14">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#737373]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Loading workspace...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-[#fafafa]"
      style={{ fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif' }}
    >
      <NoiseOverlay />
      <Header />
      {isAuth ? (
        <>
          <LoggedInLanding
            displayName={user?.name ? String(user.name) : "Architect"}
            projectCards={projectCards}
            loadingProjects={fetch.loading}
            onProjectClick={handleProjectClick}
          />
          <Footer />
        </>
      ) : (
        <>
          <GuestLanding />
          <Footer />
        </>
      )}
    </div>
  );
}
