"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/src/components/layout/brand";
import { Button } from "@/src/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex h-[88px] shrink-0 items-center justify-between px-5 sm:px-8 lg:px-16">
        <Brand />
        <div className="flex items-center gap-4 sm:gap-8">
          <span className="hidden text-[13px] text-ink-muted sm:block">
            A clearer path starts here.
          </span>
          <Link
            href="/projects"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[13px] text-ink transition-colors hover:bg-surface-muted"
          >
            Go to dashboard
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <p className="font-mono text-[11px] leading-relaxed text-brand">
          ROUTE / NOT FOUND
        </p>
        <p className="mt-2 font-mono text-[96px] leading-none text-brand sm:text-[144px]">
          404
        </p>
        <h1 className="mt-4 text-[28px] leading-[1.21] text-ink sm:text-[36px]">
          This page isn’t in the plan.
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-[1.65] text-ink-soft">
          The link may be outdated, or the page may have moved. Let’s get you
          back to your workspace.
        </p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={() => router.push("/projects")}>
            Return to dashboard
          </Button>
          <Button variant="secondary" onClick={() => router.back()}>
            Go back
          </Button>
        </div>

        <p className="mt-6 text-[12px] text-brand">
          Your projects and approved work are still saved.
        </p>
      </main>

      <footer className="flex h-[72px] shrink-0 items-center justify-between px-5 text-[11px] text-ink-muted sm:px-8 lg:px-16">
        <span>Built for the thinking before the code.</span>
        <div className="flex items-center gap-6">
          <span className="hidden font-mono sm:block">
            PLANEX / CLARITY BEFORE CODE
          </span>
        </div>
      </footer>
    </div>
  );
}
