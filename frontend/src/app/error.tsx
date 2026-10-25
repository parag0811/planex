"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Brand } from "@/src/components/layout/brand";
import { Button } from "@/src/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex h-[88px] shrink-0 items-center px-5 sm:px-8 lg:px-16">
        <Brand />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg rounded-lg border border-line bg-surface p-8 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <AlertCircle size={18} />
          </span>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            State / Failed to load
          </p>
          <h1 className="mt-2 text-[20px] font-semibold text-ink">
            We couldn’t load this section.
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            The connection was interrupted. Check your connection and try
            loading this section again.
          </p>

          <Button
            className="mt-5"
            leftIcon={<RefreshCw size={15} />}
            onClick={reset}
          >
            Retry
          </Button>

          <p className="mt-4 text-[12px] text-ink-soft">
            Your approved work is saved. Nothing has been replaced.
          </p>
        </div>
      </main>

      <footer className="flex h-[72px] shrink-0 items-center px-5 text-[11px] text-ink-muted sm:px-8 lg:px-16">
        Built for the thinking before the code.
      </footer>
    </div>
  );
}
