"use client";

import { useSelector, useDispatch } from "react-redux";
import Sidebar from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";
import { WorkspaceShell } from "@/src/components/workspace/workspace-shell";
import FullPageLoader from "@/src/components/common/FullPageLoader";
import type { RootState, AppDispatch } from "@/src/store/store";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchProjectById,
  clearProjectErrors,
} from "@/src/store/slices/projectSlice";
import { clearAllSectionErrors } from "@/src/store/slices/sectionSlice";
import { clearJobState } from "@/src/store/slices/jobSlice";

function WorkspaceLoader({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
        aria-label={label}
      />
    </div>
  );
}

export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  const currentProject = useSelector(
    (state: RootState) => state.project.currentProject,
  );
  const { authCheckLoading, isAuth } = useSelector(
    (state: RootState) => state.auth,
  );
  const ideaJobStatus = useSelector(
    (state: RootState) => state.job.jobs.idea?.status,
  );
  const databaseJobStatus = useSelector(
    (state: RootState) => state.job.jobs.database?.status,
  );
  const apiJobStatus = useSelector(
    (state: RootState) => state.job.jobs.api?.status,
  );
  const folderJobStatus = useSelector(
    (state: RootState) => state.job.jobs.folder?.status,
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    dispatch(clearProjectErrors());
    dispatch(clearAllSectionErrors());
    dispatch(clearJobState());
  }, [dispatch, pathname]);

  const isRequirementsPage = pathname?.endsWith("/idea") ?? false;
  const isDatabasePage = pathname?.endsWith("/database") ?? false;
  const isApiPage = pathname?.endsWith("/api") ?? false;
  const isFolderPage = pathname?.endsWith("/folder") ?? false;
  const usesWorkspaceShell =
    isRequirementsPage || isDatabasePage || isApiPage || isFolderPage;

  if (usesWorkspaceShell) {
    const jobStatus = isDatabasePage
      ? databaseJobStatus
      : isApiPage
        ? apiJobStatus
        : isFolderPage
          ? folderJobStatus
          : ideaJobStatus;

    return (
      <WorkspaceShell
        project={currentProject}
        projectId={projectId || ""}
        jobStatus={jobStatus}
      >
        {authCheckLoading ? (
          <WorkspaceLoader label="Loading workspace" />
        ) : !isAuth ? (
          <WorkspaceLoader label="Redirecting to login" />
        ) : (
          children
        )}
      </WorkspaceShell>
    );
  }

  return (
    <div
      className="h-[100dvh] flex flex-col bg-[#05070d]"
      style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}
    >
      <ProjectHeader
        projectName={currentProject?.name || "Project"}
        onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
      />
      <div className="flex flex-1 relative min-h-0">
        <Sidebar
          projectId={projectId}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
          {authCheckLoading ? (
            <FullPageLoader />
          ) : !isAuth ? (
            <FullPageLoader subtitle="Redirecting to login..." />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
