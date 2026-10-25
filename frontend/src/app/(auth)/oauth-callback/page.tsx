"use client";

import { Suspense, useEffect, useReducer } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AlertCircle } from "lucide-react";
import { Brand } from "@/src/components/layout/brand";
import { Button } from "@/src/components/ui/button";
import { fetchUser, setToken } from "@/src/store/slices/authSlice";
import type { AppDispatch } from "@/src/store/store";

function CallbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex h-[88px] shrink-0 items-center px-5 sm:px-8 lg:px-16">
        <Brand />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        {children}
      </main>
      <footer className="flex h-[72px] shrink-0 items-center justify-between px-5 text-[11px] text-ink-muted sm:px-8 lg:px-16">
        <span>Built for the thinking before the code.</span>
        <span className="hidden font-mono sm:block">PLANEX / AUTH</span>
      </footer>
    </div>
  );
}

function SigningIn() {
  return (
    <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 text-center">
      <div
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
        aria-label="Signing you in"
      />
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        OAuth / Callback
      </p>
      <h1 className="mt-2 text-[20px] font-semibold text-ink">
        Signing you in…
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        Verifying your account and loading your workspace.
      </p>
    </div>
  );
}

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [error, setError] = useReducer(
    (_state: string | null, next: string | null) => next,
    null as string | null,
  );

  useEffect(() => {
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const errorMessage = searchParams.get("error");
    // The backend only sends the token in the URL fragment, which is never
    // forwarded to servers or referrers. Do not accept a query-string token.
    const token = hashParams.get("token");

    // Strip the fragment (and any legacy query token) from browser history.
    if (window.location.hash || searchParams.has("token")) {
      const params = new URLSearchParams(window.location.search);
      params.delete("token");
      const query = params.toString();

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    }

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    if (!token) {
      setError("Missing token. Please try logging in again.");
      return;
    }

    localStorage.setItem("token", token);
    dispatch(setToken(token));

    dispatch(fetchUser())
      .unwrap()
      .then(() => router.replace("/projects"))
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        // Only an explicit 401 means the OAuth token is invalid. A 5xx/503
        // during a cold start must not discard a valid session.
        if (status === 401) {
          localStorage.removeItem("token");
          setError(
            (err as { message?: string })?.message ||
              "Your session is invalid. Please log in again.",
          );
          return;
        }

        router.replace("/projects");
      });
  }, [dispatch, router, searchParams]);

  if (!error) {
    return (
      <CallbackLayout>
        <SigningIn />
      </CallbackLayout>
    );
  }

  return (
    <CallbackLayout>
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-danger-soft text-danger">
          <AlertCircle size={18} />
        </span>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          OAuth / Error
        </p>
        <h1 className="mt-2 text-[20px] font-semibold text-ink">
          We couldn’t sign you in.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          {error}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={() => router.push("/login")}>Go to login</Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/register")}
          >
            Create account
          </Button>
        </div>

        <p className="mt-4 text-[11px] text-ink-muted">
          <Link href="/" className="transition-colors hover:text-ink">
            Return to Planex
          </Link>
        </p>
      </div>
    </CallbackLayout>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <CallbackLayout>
          <SigningIn />
        </CallbackLayout>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
