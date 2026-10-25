"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Braces,
  Database,
  FolderTree,
  ListChecks,
  MessagesSquare,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/src/lib/cn";
import { WORKSPACE_STAGES } from "@/src/lib/stages";

const STAGE_ICONS = {
  idea: ListChecks,
  database: Database,
  api: Braces,
  folder: FolderTree,
} as const;

export function ProjectSidebar({
  projectId,
  projectName,
  approvedStages,
  sections,
  jobStatus,
  onNavigate,
}: {
  projectId: string;
  projectName: string;
  approvedStages: number;
  sections: string[];
  jobStatus?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "";
  const activeStage = WORKSPACE_STAGES.find((stage) =>
    pathname.endsWith(`/${stage.path}`),
  );
  const settingsActive = pathname === `/projects/${projectId}`;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-surface px-4 py-6">
      <Link
        href="/projects"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 text-[12px] text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} />
        All projects
      </Link>

      <div className="flex flex-col gap-2 px-2">
        <div className="flex items-center gap-2">
          <MessagesSquare size={18} className="text-ink-muted" />
          <p className="truncate text-[14px] font-semibold text-ink">
            {projectName}
          </p>
        </div>
        <p className="text-[12px] text-ink-muted">
          {Math.min(approvedStages, 4)}/4 stages approved
        </p>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((segment) => (
            <span
              key={segment}
              className={cn(
                "h-1 flex-1 rounded-xs",
                segment < approvedStages ? "bg-brand" : "bg-line",
              )}
            />
          ))}
        </div>
      </div>

      <nav aria-label="Blueprint stages" className="flex flex-col gap-2">
        {WORKSPACE_STAGES.map((stage) => {
          const Icon = STAGE_ICONS[stage.id];
          const active = activeStage?.id === stage.id;
          const approved = sections.includes(stage.type);
          const generating =
            active &&
            (jobStatus === "pending" || jobStatus === "processing");

          const status = approved
            ? "Approved · Saved"
            : generating
              ? "Generating…"
              : "Draft · Not saved";

          return (
            <Link
              key={stage.id}
              href={`/projects/${projectId}/${stage.path}`}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 transition-colors",
                active ? "bg-brand-soft" : "hover:bg-surface-muted",
              )}
            >
              <Icon
                size={18}
                strokeWidth={1.6}
                className={active ? "text-brand" : "text-ink-muted"}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[13px]",
                    active
                      ? "font-semibold text-brand"
                      : "font-normal text-ink",
                  )}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted">{status}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <div className="rounded-lg bg-canvas p-4">
          <ShieldCheck size={18} className="text-brand" strokeWidth={1.6} />
          <p className="mt-2 text-[12px] text-ink">
            You make the final call.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            AI suggests. You review, edit and approve. Nothing is saved
            automatically.
          </p>
        </div>

        <Link
          href={`/projects/${projectId}`}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors",
            settingsActive
              ? "bg-brand-soft text-brand"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <Settings2 size={16} />
          Project settings
        </Link>
      </div>
    </div>
  );
}
