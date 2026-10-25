"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/src/components/layout/brand";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { joinProjectByToken } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function InvitePage() {
  const { projectName, token } = useParams<{
    projectName: string;
    token: string;
  }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { isAuth, authCheckLoading } = useSelector(
    (state: RootState) => state.auth,
  );
  const { join } = useSelector((state: RootState) => state.project);
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (authCheckLoading) return;
    if (!isAuth) {
      router.replace(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }, [isAuth, authCheckLoading, router]);

  if (!mounted || authCheckLoading || !isAuth) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
          aria-label="Verifying authentication"
        />
      </div>
    );
  }

  const handleJoin = async () => {
    if (!token) return;
    try {
      await dispatch(joinProjectByToken(token)).unwrap();
      router.push("/projects");
    } catch {
      // The error is rendered from Redux state below.
    }
  };

  const displayName = decodeURIComponent(projectName || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex h-[88px] shrink-0 items-center px-5 sm:px-8 lg:px-16">
        <Brand />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <p className="font-mono text-[11px] leading-relaxed text-brand">
              INVITATION
            </p>
            <h1 className="mt-3 text-[32px] leading-[1.21] text-ink">
              Join {displayName || "this workspace"}
            </h1>
            <p className="mt-2 text-[13px] leading-[1.6] text-ink-muted">
              You have been invited to collaborate on this workspace.
            </p>

            {join.error ? (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[12px] text-danger"
              >
                {join.error}
              </div>
            ) : null}

            <Button
              className="mt-6 w-full"
              loading={join.loading}
              rightIcon={<ArrowRight size={15} />}
              onClick={() => void handleJoin()}
            >
              Accept invitation
            </Button>

            <p className="mt-4 text-center text-[11px] text-ink-muted">
              <Link
                href="/projects"
                className="transition-colors hover:text-ink"
              >
                Cancel and return to projects
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="flex h-[72px] shrink-0 items-center justify-between px-5 text-[11px] text-ink-muted sm:px-8 lg:px-16">
        <span>Built for the thinking before the code.</span>
        <span className="font-mono">PLANEX / INVITE</span>
      </footer>
    </div>
  );
}
