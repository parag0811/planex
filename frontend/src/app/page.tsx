"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Database,
  FolderTree,
  Layers,
  ListChecks,
  LockKeyhole,
} from "lucide-react";
import { Brand } from "@/src/components/layout/brand";
import { Button } from "@/src/components/ui/button";
import { useMounted } from "@/src/hooks/useMounted";
import { generateIdea } from "@/src/store/slices/jobSlice";
import { createProject } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const PENDING_IDEA_KEY = "planex_pending_idea";

const PIPELINE = [
  {
    number: "01",
    title: "Requirements",
    description: "Get clear on the what.",
    icon: ListChecks,
  },
  {
    number: "02",
    title: "Database",
    description: "Give your data a home.",
    icon: Database,
  },
  {
    number: "03",
    title: "API",
    description: "Define every connection.",
    icon: Braces,
  },
  {
    number: "04",
    title: "Folder Structure",
    description: "Start with solid foundations.",
    icon: FolderTree,
  },
] as const;

const INSPIRATIONS = [
  "Team task manager",
  "Personal finance app",
  "Booking platform",
] as const;

const deriveProjectName = (idea: string) => {
  const firstSentence = idea.trim().split(/[.\n]/)[0]?.trim() ?? "";
  const cleaned = firstSentence.replace(/\s+/g, " ");
  if (cleaned.length >= 3) return cleaned.slice(0, 50);
  return "Untitled project";
};

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const mounted = useMounted();
  const { isAuth, authCheckLoading } = useSelector(
    (state: RootState) => state.auth,
  );
  const authed = mounted && isAuth;

  const [idea, setIdea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const pending = window.sessionStorage.getItem(PENDING_IDEA_KEY);
    if (pending) {
      setIdea(pending);
      window.sessionStorage.removeItem(PENDING_IDEA_KEY);
    }
  }, []);

  const handleGenerate = async () => {
    const trimmed = idea.trim();

    if (trimmed.length < 10) {
      setError("Describe the idea in at least 10 characters.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Keep the idea under 1000 characters.");
      return;
    }

    setError(null);

    if (!isAuth) {
      window.sessionStorage.setItem(PENDING_IDEA_KEY, trimmed);
      router.push("/login?next=/");
      return;
    }

    setSubmitting(true);

    try {
      const project = await dispatch(
        createProject({ name: deriveProjectName(trimmed) }),
      ).unwrap();

      if (!project?.id) {
        throw new Error("Project was created but no id was returned.");
      }

      const queued = await dispatch(
        generateIdea({ projectId: project.id, idea: trimmed }),
      ).unwrap();

      const jobId = (queued as { jobId?: string })?.jobId;
      router.push(
        `/projects/${project.id}/idea${jobId ? `?jobId=${jobId}` : ""}`,
      );
    } catch (err: unknown) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Could not start the blueprint. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex h-[72px] shrink-0 items-center justify-between px-5 sm:h-[88px] sm:px-8 lg:px-16">
        <Brand />

        <div className="flex items-center gap-4 sm:gap-8">
          <a
            href="#pipeline"
            className="hidden text-[13px] text-ink-soft transition-colors hover:text-ink sm:block"
          >
            How it works
          </a>
          <Link
            href={authed ? "/projects" : "/login?next=/"}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[13px] text-ink transition-colors hover:bg-surface-muted"
          >
            Go to workspace
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center gap-6 px-5 pt-10 text-center sm:px-8 sm:pt-14">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-brand" strokeWidth={1.6} />
            <p className="font-mono text-[11px] leading-relaxed text-brand">
              LESS GUESSWORK. BETTER FOUNDATIONS.
            </p>
          </div>

          <h1 className="max-w-[1000px] text-[40px] leading-[1.12] tracking-[-0.03em] text-ink sm:text-[56px]">
            Your next idea,
            <br />
            engineering-ready.
          </h1>

          <p className="max-w-[560px] text-[15px] leading-[1.5] text-ink-soft sm:text-[17px]">
            Turn a rough idea into a clear blueprint. AI drafts it. You make it
            yours.
          </p>

          <div className="mt-4 w-full max-w-[800px] rounded-lg border border-line bg-surface p-6 text-left">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="idea" className="text-[13px] text-ink">
                What do you want to build?
              </label>
              <span className="font-mono text-[11px] text-ink-muted">
                01 / IDEA
              </span>
            </div>

            <textarea
              id="idea"
              value={idea}
              onChange={(event) => {
                setIdea(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleGenerate();
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder="A customer feedback hub for SaaS teams — ideas, voting and a public roadmap."
              className="mt-4 min-h-[52px] w-full resize-none bg-transparent text-[15px] leading-[1.65] text-ink-soft outline-none placeholder:text-ink-muted sm:text-base"
            />

            <div className="mt-4 h-px w-full bg-line" />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                <LockKeyhole size={14} strokeWidth={1.6} />
                Your idea stays private. Always yours to edit.
              </div>

              <Button
                onClick={() => void handleGenerate()}
                loading={submitting || !mounted || authCheckLoading}
                rightIcon={<ArrowRight size={16} />}
                className="w-full sm:w-auto"
              >
                Generate plan
              </Button>
            </div>

            {error ? (
              <p className="mt-3 text-[11px] text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-ink-muted">Try an idea</span>
            {INSPIRATIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => {
                  setIdea(text);
                  setError(null);
                }}
                className="rounded-md bg-surface-muted px-2 py-1 text-[11px] text-ink-soft transition-colors hover:bg-brand-soft hover:text-brand"
              >
                {text}
              </button>
            ))}
          </div>
        </section>

        <section
          id="pipeline"
          className="mx-auto mt-10 w-full max-w-[1152px] px-5 sm:mt-16 sm:px-8 lg:px-0"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink">One idea. Four considered steps.</p>
            <p className="text-xs text-ink-muted">
              Review and approve at every stage.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="flex gap-3 rounded-lg border border-line bg-surface p-5"
              >
                <div className="flex flex-col items-center gap-3">
                  <Icon size={20} className="text-brand" strokeWidth={1.6} />
                  <span className="font-mono text-[10px] text-ink-muted">
                    {number}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] text-ink">{title}</p>
                  <p className="text-[11px] leading-relaxed text-ink-muted">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="flex h-[124px] shrink-0 flex-col justify-end px-5 pb-6 sm:px-8 lg:px-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-ink-muted">
            Built for the thinking before the code.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] text-ink-muted">
              PLANEX / 01
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
