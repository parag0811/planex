"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  FolderKanban,
  Layers,
  MessagesSquare,
  NotebookPen,
  Plus,
  Search,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/cn";
import { fetchProjects } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

type Filter = "all" | "progress" | "complete";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All projects" },
  { id: "progress", label: "In progress" },
  { id: "complete", label: "Complete" },
];

const STAGES = [
  { type: "IDEA", label: "Review Requirements", path: "idea" },
  { type: "DATABASE", label: "Review Database", path: "database" },
  { type: "API", label: "Review API", path: "api" },
  { type: "FOLDER", label: "Review Folder", path: "folder" },
] as const;

const PROJECT_ICONS = [
  MessagesSquare,
  NotebookPen,
  CalendarDays,
  FolderKanban,
  Layers,
  Boxes,
] as const;

const relativeTime = (value?: string) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function ProjectsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading, fetch: fetchState } = useSelector(
    (state: RootState) => state.project,
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("project-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const counts = useMemo(() => {
    const complete = projects.filter(
      (project) => (project.approvedStages ?? 0) >= 4,
    ).length;
    const progress = projects.filter((project) => {
      const stages = project.approvedStages ?? 0;
      return stages > 0 && stages < 4;
    }).length;

    return { all: projects.length, progress, complete };
  }, [projects]);

  const visible = useMemo(() => {
    const byStatus = projects.filter((project) => {
      const stages = project.approvedStages ?? 0;
      if (filter === "complete") return stages >= 4;
      if (filter === "progress") return stages > 0 && stages < 4;
      return true;
    });

    const query = search.trim().toLowerCase();
    if (!query) return byStatus;

    return byStatus.filter((project) =>
      [project.name, project.summary, project.owner?.name, project.owner?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, filter, search]);

  const firstName = String(user?.name || "").trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 lg:px-16 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-[28px] font-semibold leading-tight text-ink">
            Your projects
          </h1>
          <p className="text-sm text-ink-muted">
            {firstName
              ? `Good to see you, ${firstName}. Pick up where your thinking left off.`
              : "Pick up where your thinking left off."}
          </p>
        </div>

        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => router.push("/")}
          className="w-full sm:w-auto"
        >
          New project
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          {FILTERS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "text-[13px] transition-colors",
                  active
                    ? "font-semibold text-brand"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {label}
                <span
                  className={cn(
                    "ml-1.5 font-mono text-[11px]",
                    active ? "text-brand" : "text-ink-muted",
                  )}
                >
                  {counts[id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-[256px]">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <Input
            id="project-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="pl-9 pr-12"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-muted">
            ⌘ K
          </kbd>
        </div>
      </div>

      {fetchState.error && !loading ? (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-xs text-danger">
          <span>{fetchState.error}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch(fetchProjects())}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[264px] rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={18} />}
            title={
              search || filter !== "all"
                ? "No matching projects"
                : "No projects yet"
            }
            description={
              search || filter !== "all"
                ? "Try a different filter or clear the search."
                : "Create your first project and turn an idea into a blueprint."
            }
            action={
              search || filter !== "all" ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  leftIcon={<Plus size={15} />}
                  onClick={() => router.push("/")}
                >
                  Create project
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {visible.map((project) => {
              const approved = Math.min(project.approvedStages ?? 0, 4);
              const percent = Math.round((approved / 4) * 100);
              const nextStage =
                STAGES.find(
                  (stage) => !(project.sections ?? []).includes(stage.type),
                ) ?? null;

              const complete = approved >= 4;
              const status = complete
                ? { label: "Complete", tone: "brand" as const }
                : approved > 0
                  ? { label: "In progress", tone: "neutral" as const }
                  : { label: "Draft", tone: "warning" as const };

              const iconIndex =
                [...(project.name || "p")].reduce(
                  (sum, character) => sum + character.charCodeAt(0),
                  0,
                ) % PROJECT_ICONS.length;
              const Icon = PROJECT_ICONS[iconIndex] ?? MessagesSquare;

              const href = `/projects/${project.id}${
                nextStage ? `/${nextStage.path}` : ""
              }`;

              return (
                <Link
                  key={project.id}
                  href={href}
                  className="flex min-h-[264px] flex-col gap-4 rounded-lg border border-line bg-surface p-6 transition-colors hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Icon size={20} strokeWidth={1.6} />
                    </span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>

                  <div className="space-y-1">
                    <h2 className="line-clamp-1 text-lg font-semibold leading-snug text-ink">
                      {project.name}
                    </h2>
                    <p className="line-clamp-1 text-[13px] text-ink-muted">
                      {project.summary ||
                        "No summary yet — add an idea to get started."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-ink-soft">
                        {approved}/4 stages approved
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted">
                        {percent}%
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((segment) => (
                        <span
                          key={segment}
                          className={cn(
                            "h-1 flex-1 rounded-xs",
                            segment < approved
                              ? "bg-brand"
                              : "bg-surface-muted",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-[11px] text-ink-muted">
                      {relativeTime(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-brand">
                      {nextStage?.label ?? "View blueprint"}
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-8 text-[11px] leading-relaxed text-ink-muted">
        Only approved stages become part of your saved blueprint. Your drafts
        stay yours to refine.
      </p>
    </div>
  );
}
