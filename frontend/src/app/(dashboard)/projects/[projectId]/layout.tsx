"use client";

import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import Sidebar from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";
import type { RootState } from "@/src/store/store";

export default function ProjectIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const projectId = pathname.split("/")[2] || "";
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

      <div className="flex min-h-[calc(100vh-3.5rem)] relative">
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