"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { CopilotPanel } from "@/src/components/workspace/copilot-panel";
import { ProjectSidebar } from "@/src/components/workspace/project-sidebar";
import { WorkspaceTopBar } from "@/src/components/workspace/workspace-top-bar";
import { getStageFromPath } from "@/src/lib/stages";
import type { Project } from "@/src/store/slices/projectSlice";
import type { ChatSectionType } from "@/src/store/slices/jobSlice";

export function WorkspaceShell({
  project,
  projectId,
  jobStatus,
  children,
}: {
  project: Project | null;
  projectId: string;
  jobStatus?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const stage = getStageFromPath(pathname);
  const section = (stage?.id ?? "none") as ChatSectionType;
  const projectName = project?.name || "Project";
  const approvedStages = project?.approvedStages ?? 0;
  const sections = project?.sections ?? [];

  const sidebar = (onNavigate?: () => void) => (
    <ProjectSidebar
      projectId={projectId}
      projectName={projectName}
      approvedStages={approvedStages}
      sections={sections}
      jobStatus={jobStatus}
      onNavigate={onNavigate}
    />
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas">
      <WorkspaceTopBar
        projectName={projectName}
        onMenuToggle={() => setMobileOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-line lg:block">
          {sidebar()}
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>

        {stage?.id === "idea" ? (
          <aside className="hidden w-80 shrink-0 border-l border-line xl:block">
            <CopilotPanel projectId={projectId} section={section} />
          </aside>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface shadow-popover">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close project navigation"
              className="absolute right-2 top-3 z-10 rounded p-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
            >
              <X size={16} />
            </button>
            {sidebar(() => setMobileOpen(false))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
