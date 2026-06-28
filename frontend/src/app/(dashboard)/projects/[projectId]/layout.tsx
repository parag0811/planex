"use client";

import { useSelector } from "react-redux";
import Sidebar from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";
import type { RootState } from "@/src/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/src/store/store";
import { fetchProjectById } from "@/src/store/slices/projectSlice";

export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector(
    (state: RootState) => state.project.currentProject,
  );

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, projectId]);

  const projectName = currentProject?.name || "Project";

  return (
    <div
      className="min-h-screen bg-[#05070d]"
      style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}
    >
      <ProjectHeader projectName={projectName} />
      <div className="flex min-h-[calc(100vh-3.5rem)] relative">
        <Sidebar projectId={projectId} />
        <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
