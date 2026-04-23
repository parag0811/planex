"use client";

import { useSelector } from "react-redux";
import Sidebar from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";
import type { RootState } from "@/src/store/store";

export default function ProjectIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const { projectId } = params;
  const currentProject = useSelector(
    (state: RootState) => state.project.currentProject,
  );
  const projectName = currentProject?.name || "Project";

  return (
    <div
      className="min-h-screen bg-[#05070d]"
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        color: "#e0d5c5",
      }}
    >
      <ProjectHeader projectName={projectName} />

      <div className="flex min-h-[calc(100vh-3rem)] relative">
        {/* Sidebar */}
        <Sidebar
          projectId={projectId}
          projectName={projectName}
          projectStatus="Active"
        />

        {/* Right side: page content */}
        <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}