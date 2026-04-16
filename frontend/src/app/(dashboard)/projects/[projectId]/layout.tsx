"use client";

import Sidebar from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";

export default function ProjectIdLayout({
  children,
  params,
  projectName = "Project Obsidian",
}: {
  children: React.ReactNode;
  params: { projectId: string };
  projectName?: string;
}) {
  const { projectId } = params;

  return (
    <div
      className="flex min-h-screen relative"
      style={{
        background: "radial-gradient(ellipse at 15% 40%, #1e0e00 0%, #0c0702 45%, #080500 100%)",
        fontFamily: "'Rajdhani', sans-serif",
        color: "#e0d5c5",
      }}
    >
      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <Sidebar
        projectId={projectId}
        projectName={projectName}
        projectStatus="Active"
      />

      {/* Right side: header + page content */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <ProjectHeader projectName={projectName} />
        {children}
      </div>
    </div>
  );
}