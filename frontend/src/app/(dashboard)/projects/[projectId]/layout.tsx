"use client";

import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const currentProject = useSelector(
    (state: RootState) => state.project.currentProject,
  );
  const projectName = currentProject?.name || "Project";

  // Only show header for section pages, not the overview page
  const isOverviewPage = pathname === `/projects/${projectId}`;
  const showHeader = !isOverviewPage;

  return (
    <div
      className="flex min-h-screen relative bg-[#06070c]"
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        color: "#e0d5c5",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        projectId={projectId}
        projectName={projectName}
        projectStatus="Active"
      />

      {/* Right side: header + page content */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        {showHeader && <ProjectHeader projectName={projectName} />}
        {children}
      </div>
    </div>
  );
}