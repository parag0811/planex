"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "@/src/components/layout/dashboard-shell";

/** Routes under /projects that are pages, not project ids. */
const STATIC_PROJECT_ROUTES = new Set(["create-project", "templates"]);

function ShellLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
        aria-label={label}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { authCheckLoading, isAuth } = useSelector(
    (state: RootState) => state.auth,
  );

  const segments = (pathname || "").split("/").filter(Boolean);
  const isProjectDetailPage =
    segments[0] === "projects" &&
    segments.length >= 2 &&
    !STATIC_PROJECT_ROUTES.has(segments[1] ?? "");

  useEffect(() => {
    if (authCheckLoading) return;
    if (!isAuth) {
      router.replace("/login");
    }
  }, [authCheckLoading, isAuth, router]);

  if (isProjectDetailPage) {
    return <div className="flex h-full w-full flex-col">{children}</div>;
  }

  return (
    <DashboardShell>
      {authCheckLoading ? (
        <ShellLoader label="Restoring session" />
      ) : !isAuth ? (
        <ShellLoader label="Redirecting to login" />
      ) : (
        children
      )}
    </DashboardShell>
  );
}
