import Link from "next/link";
import type { ReactNode } from "react";
import {
  Braces,
  CheckCircle2,
  Database,
  FolderTree,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Brand } from "@/src/components/layout/brand";

type AuthMode = "login" | "register";

const COPY: Record<
  AuthMode,
  {
    eyebrow: string;
    headline: ReactNode;
    description: string;
    navPrompt: string;
    navAction: string;
    navHref: string;
  }
> = {
  login: {
    eyebrow: "LESS GUESSWORK. BETTER FOUNDATIONS.",
    headline: (
      <>
        Pick up where
        <br />
        your thinking left off.
      </>
    ),
    description:
      "Your ideas, decisions and approved blueprints. All in one calm place, ready when you are.",
    navPrompt: "New to Planex?",
    navAction: "Create an account",
    navHref: "/register",
  },
  register: {
    eyebrow: "LESS GUESSWORK. BETTER FOUNDATIONS.",
    headline: (
      <>
        Your next idea,
        <br />
        engineering-ready.
      </>
    ),
    description:
      "Turn a rough idea into a clear blueprint. AI drafts it. You review, edit and make it yours.",
    navPrompt: "Already have an account?",
    navAction: "Log in",
    navHref: "/login",
  },
};

const STEPS = [
  { number: "01", label: "Requirements", icon: ListChecks },
  { number: "02", label: "Database", icon: Database },
  { number: "03", label: "API", icon: Braces },
  { number: "04", label: "Folder Structure", icon: FolderTree },
] as const;

function ProductIntroduction({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode];

  return (
    <section className="w-full max-w-[480px] space-y-8">
      <div className="space-y-4">
        <p className="font-mono text-[11px] leading-relaxed text-brand">
          {copy.eyebrow}
        </p>
        <h1 className="text-[34px] leading-[1.14] tracking-[-0.02em] text-ink sm:text-[44px]">
          {copy.headline}
        </h1>
        <p className="max-w-[432px] text-[15px] leading-[1.65] text-ink-soft">
          {copy.description}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          One idea. Four considered steps.
        </p>
        <div className="flex gap-2">
          {STEPS.map(({ number, label, icon: Icon }) => (
            <div key={number} className="flex w-full max-w-[114px] flex-col gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <div className="space-y-1">
                <p className="font-mono text-[10px] leading-tight text-ink-muted">
                  {number}
                </p>
                <p className="text-[11px] leading-tight text-ink-soft">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-brand" strokeWidth={1.6} />
          <Badge tone="brand">Approved · Saved</Badge>
        </div>
        <p className="mt-3 text-sm text-ink">Pulse feedback · Product overview</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          A customer feedback hub for SaaS teams, built around ideas and votes.
        </p>
        <p className="mt-2 font-mono text-[10px] text-ink-muted">
          Reviewed by you · Saved to your workspace
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <ShieldCheck size={16} className="text-brand" strokeWidth={1.6} />
        You decide what becomes part of the plan.
      </div>
    </section>
  );
}

export interface AuthShellProps {
  mode: AuthMode;
  children: ReactNode;
}

export function AuthShell({ mode, children }: AuthShellProps) {
  const copy = COPY[mode];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex h-[72px] shrink-0 items-center justify-between px-5 sm:h-[88px] sm:px-8 lg:px-16">
        <Brand />

        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="#"
            className="hidden text-[13px] text-ink-soft transition-colors hover:text-ink sm:block"
          >
            Docs
          </Link>
          <span className="hidden text-[13px] text-ink-muted sm:block">
            {copy.navPrompt}
          </span>
          <Link
            href={copy.navHref}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[13px] text-ink transition-colors hover:bg-surface-muted"
          >
            {copy.navAction}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1152px] flex-1 flex-col gap-10 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-0 lg:py-16">
        <div className="hidden lg:block">
          <ProductIntroduction mode={mode} />
        </div>
        <div className="w-full lg:w-[432px] lg:shrink-0">{children}</div>
      </main>

      <footer className="flex h-[72px] shrink-0 items-center justify-between px-5 sm:px-8 lg:px-16">
        <p className="text-[11px] text-ink-muted">
          Built for the thinking before the code.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="#"
            className="text-[11px] text-ink-muted transition-colors hover:text-ink"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-[11px] text-ink-muted transition-colors hover:text-ink"
          >
            Terms
          </Link>
          <span className="hidden font-mono text-[11px] text-ink-muted sm:block">
            PLANEX / CLARITY BEFORE CODE
          </span>
        </div>
      </footer>
    </div>
  );
}
