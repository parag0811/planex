"use client";

import { useSelector } from "react-redux";
import Sidebar from "@/src/components/layout/project-section/SidebarLeft";
import ProjectHeader from "@/src/components/layout/project-section/ProjectHeader";
import type { RootState } from "@/src/store/store";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/src/store/store";
import { fetchProjectById, clearProjectErrors } from "@/src/store/slices/projectSlice";
import { clearAllSectionErrors } from "@/src/store/slices/sectionSlice";
import { clearJobState } from "@/src/store/slices/jobSlice";
import FullPageLoader from "@/src/components/common/FullPageLoader";

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

  const projectName = currentProject?.name || "Project";

  return (
    <div
      className="h-[100dvh] flex flex-col bg-[#05070d]"
      style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}
    >
      <ProjectHeader 
        projectName={projectName} 
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
