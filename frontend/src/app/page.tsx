"use client";

import { useEffect, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
  Plus,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Code2,
  Database,
  FolderTree,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { fetchProjects } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

type ProjectPreview = {
  id: string;
  title: string;
  tags: string[];
  edited: string;
  active: boolean;
  color: string;
};

const guestFeatures = [
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

const previewPalette = ["#1e3a3a", "#1e2a3a", "#1a1200"];

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
    color: previewPalette[index % previewPalette.length],
  }));

function LandingImagePanel({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative min-h-110 overflow-hidden rounded-4xl border border-white/10 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.4)] lg:min-h-130">
      <Image
        src="/landing.jpg"
        alt="Planex code background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-tr from-[#1a1200]/95 via-[#1a1200]/35 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="absolute left-5 right-5 bottom-5 rounded-2xl border border-white/10 bg-[#1a1200]/78 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#f97316]/70">
              {badge}
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/55">
              {subtitle}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f97316]/25 bg-[#f97316]/10 text-[#f97316]">
            <Sparkles size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GuestLanding() {
  return (
    <>
      <section className="px-6 pb-14 pt-28 md:pb-18 md:pt-32">
        <div className="mx-auto grid max-w-330 items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-18 xl:gap-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p
              variants={makeFadeUp(0)}
              className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#f97316]/70"
            >
              AI product planning studio
            </motion.p>

            <motion.h1
              variants={makeFadeUp(1)}
              className="max-w-xl text-5xl font-extrabold leading-[1.03] tracking-tight md:text-6xl lg:text-[4.4rem]"
            >
              Architect your
              <br />
              vision with <span className="text-[#f97316]">AI precision</span>
            </motion.h1>

            <motion.p
              variants={makeFadeUp(2)}
              className="mt-6 max-w-xl text-base leading-relaxed text-[#a89880]"
            >
              The workspace for turning ideas into structured products. Define
              APIs, model schemas, and scaffold your stack with a sharper
              planning flow.
            </motion.p>

            <motion.div
              variants={makeFadeUp(3)}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-full bg-[#f97316] px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] hover:bg-[#ea6c0a]"
              >
                <Plus size={16} />
                Create New Project
              </Link>
              <Link
                href="#core-engine"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <ArrowRight size={14} />
                Explore workflow
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          >
            <LandingImagePanel
              badge="Landing canvas"
              title="Planex workspace preview"
              subtitle="A focused visual surface for your architecture, code, and planning context."
            />
          </motion.div>
        </div>
      </section>

      <section id="core-engine" className="px-6 pb-20 md:pb-24">
        <div className="mx-auto max-w-330">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f97316]">
              Core engine
            </p>
            <h2 className="max-w-lg text-4xl font-extrabold leading-tight text-white">
              Engineered for the modern developer workflow
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#a89880]">
              Comprehensive tools to transition from conceptual spark to
              production-ready architecture in record time.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {guestFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={makeFadeUp(index)}
                whileHover={{ y: -4, borderColor: "rgba(249,115,22,0.3)" }}
                className="group rounded-2xl border border-white/8 bg-[#1e1600] p-6 transition-all duration-300"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f97316]/10 transition-colors group-hover:bg-[#f97316]/20">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-sm font-bold text-white">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-[#6b5c4c]">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-330">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative overflow-hidden rounded-3xl bg-[#f97316] px-10 py-16 text-center"
          >
            <div className="absolute inset-0 select-none opacity-10 pointer-events-none">
              <div className="absolute left-8 top-4 text-[120px] font-black leading-none text-black">
                &lt;/&gt;
              </div>
            </div>

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-4 text-4xl font-extrabold leading-tight text-black lg:text-5xl"
              >
                Ready to build the future?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto mb-10 max-w-md text-sm text-black/70"
              >
                Join developers who are planning their next big thing with
                Planex AI.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  href="/register"
                  className="rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.03] hover:bg-[#1a1200]"
                >
                  Start free project
                </Link>
                <Link
                  href="#core-engine"
                  className="rounded-full border-2 border-black px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-black/10"
                >
                  Explore the platform
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function LoggedInLanding({
  displayName,
  projectCards,
  loadingProjects,
}: {
  displayName: string;
  projectCards: ProjectPreview[];
  loadingProjects: boolean;
}) {
  return (
    <>
      <section className="px-6 pb-14 pt-28 md:pb-18 md:pt-32">
        <div className="mx-auto grid max-w-330 items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-18 xl:gap-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p
              variants={makeFadeUp(0)}
              className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#f97316]/70"
            >
              Welcome back, {displayName}
            </motion.p>

            <motion.h1
              variants={makeFadeUp(1)}
              className="max-w-xl text-5xl font-extrabold leading-[1.03] tracking-tight md:text-6xl lg:text-[4.4rem]"
            >
              Continue where your last project left off.
            </motion.h1>

            <motion.p
              variants={makeFadeUp(2)}
              className="mt-6 max-w-xl text-base leading-relaxed text-[#a89880]"
            >
              Open a workspace, review recent activity, or launch a new project
              without seeing the marketing page again.
            </motion.p>

            <motion.div
              variants={makeFadeUp(3)}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/projects"
                className="flex items-center gap-2 rounded-full bg-[#f97316] px-6 py-3 text-sm font-bold text-black transition-all hover:scale-[1.03] hover:bg-[#ea6c0a]"
              >
                <ArrowRight size={16} />
                Go to projects
              </Link>
              <Link
                href="/projects/create-project"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <Plus size={16} />
                Continue project
              </Link>
            </motion.div>

            <motion.div
              variants={makeFadeUp(4)}
              className="mt-10 grid max-w-xl grid-cols-3 gap-3"
            >
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/35">
                  Projects
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {projectCards.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/35">
                  Recent
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {Math.min(3, projectCards.length)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/35">
                  Mode
                </p>
                <p className="mt-2 text-lg font-black text-[#f97316]">Active</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          >
            <LandingImagePanel
              badge="Workspace online"
              title="Your Planex workspace"
              subtitle="Recent projects, architecture decisions, and planning context are ready when you are."
            />
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="mx-auto max-w-330">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <RotateCcw size={16} className="text-[#f97316]" />
              <h2 className="text-xl font-bold text-white">Recent projects</h2>
            </div>
            <Link
              href="/projects"
              className="text-sm text-[#f97316] hover:underline"
            >
              Open projects
            </Link>
          </div>

          {loadingProjects ? (
            <div className="rounded-2xl border border-white/8 bg-white/5 px-5 py-6 text-sm text-white/45">
              Loading your projects...
            </div>
          ) : projectCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-white/45">
              No projects yet. Create your first project to see it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {projectCards.map((project, index) => (
                <motion.div
                  key={project.id}
                  variants={makeFadeUp(index)}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group overflow-hidden rounded-2xl border border-white/8 bg-[#1e1600]"
                >
                  <div
                    className="relative h-40 w-full"
                    style={{ backgroundColor: project.color }}
                  >
                    <div className="absolute inset-0 flex items-end justify-center gap-1 px-6 pb-4 pt-8">
                      {[40, 65, 45, 80, 55, 70, 50, 90, 60].map(
                        (height, barIndex) => (
                          <motion.div
                            key={barIndex}
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              delay: 0.3 + barIndex * 0.05,
                              duration: 0.4,
                            }}
                            style={{ height: `${height}%` }}
                            className="w-full origin-bottom rounded-t bg-[#f97316]/30 transition-colors group-hover:bg-[#f97316]/50"
                          />
                        ),
                      )}
                    </div>
                    {project.active && (
                      <div className="absolute right-3 top-3 rounded bg-[#f97316] px-2 py-0.5 text-[10px] font-bold text-black">
                        ACTIVE
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between p-5">
                    <div>
                      <h3 className="mb-1 text-sm font-semibold text-white">
                        {project.title}
                      </h3>
                      <p className="text-xs text-[#6b5c4c]">
                        {project.tags.join(" • ")}
                      </p>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-[#4a3a2a]">
                        Edited {project.edited}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 transition-all group-hover:border-[#f97316]/50 group-hover:bg-[#f97316]/10">
                      <ArrowRight
                        size={14}
                        className="text-[#6b5c4c] transition-colors group-hover:text-[#f97316]"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="px-6 pb-8">
        <div className="mx-auto flex max-w-330 flex-col items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/3 px-5 py-4 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#f97316]/70">
              Workspace active
            </p>
            <p className="mt-1 text-sm text-white/70">
              Jump straight into your project dashboard when you need the full
              planning view.
            </p>
          </div>
          <Link
            href="/projects"
            className="rounded-full bg-[#f97316] px-5 py-2 text-sm font-bold text-black transition-all hover:scale-[1.03] hover:bg-[#ea6c0a]"
          >
            Open projects
          </Link>
        </div>
      </footer>
    </>
  );
}

export default function LandingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuth, loading, token, user } = useSelector(
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

  if (authPending) {
    return (
      <div className="min-h-screen bg-[#1a1200] text-white font-sans">
        <Header />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 pt-16">
          <div className="rounded-3xl border border-white/10 bg-white/3 px-6 py-5 text-sm text-white/65 backdrop-blur-md">
            Loading your workspace...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1200] text-white font-sans">
      <Header />
      {isAuth ? (
        <LoggedInLanding
          displayName={user?.name ? String(user.name) : "Architect"}
          projectCards={projectCards}
          loadingProjects={fetch.loading}
        />
      ) : (
        <>
          <GuestLanding />
          <Footer />
        </>
      )}
    </div>
  );
}
