"use client";

import { useSelector, useDispatch } from "react-redux";
import { WorkspaceShell } from "@/src/components/workspace/workspace-shell";
import type { RootState, AppDispatch } from "@/src/store/store";
import { usePathname, useParams } from "next/navigation";
import { useEffect } from "react";
import { useMounted } from "@/src/hooks/useMounted";
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
  const mounted = useMounted();

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

  const jobStatus = pathname?.endsWith("/database")
    ? databaseJobStatus
    : pathname?.endsWith("/api")
      ? apiJobStatus
      : pathname?.endsWith("/folder")
        ? folderJobStatus
        : ideaJobStatus;

  return (
    <WorkspaceShell
      project={currentProject}
      projectId={projectId || ""}
      jobStatus={jobStatus}
    >
      {!mounted || authCheckLoading ? (
        <WorkspaceLoader label="Loading workspace" />
      ) : !isAuth ? (
        <WorkspaceLoader label="Redirecting to login" />
      ) : (
        children
      )}
    </WorkspaceShell>
  );
}
