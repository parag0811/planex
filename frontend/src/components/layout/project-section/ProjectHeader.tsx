"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings, UserCircle2 } from "lucide-react";

interface ProjectHeaderProps {
  projectName?: string;
}

const HEADER_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projects" },
  { id: "compute", label: "Compute" },
  { id: "logs", label: "Logs" },
] as const;

export default function ProjectHeader({
  projectName = "Project Obsidian",
}: ProjectHeaderProps) {
  const pathname = usePathname();

  const projectId = pathname.split("/")[2];
  const dashboardHref = projectId ? `/projects/${projectId}` : "/projects";
  const projectsHref = "/projects";

  const activeTab = pathname === "/projects" ? "projects" : "dashboard";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 border-b border-white/5 bg-[#070910]/95 backdrop-blur"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={dashboardHref} className="shrink-0 cursor-pointer text-[28px] leading-none font-bold text-white">
            Planex
          </Link>

          <nav className="hidden sm:flex items-center gap-4">
            {HEADER_TABS.map((tab) => {
              const href = tab.id === "dashboard" ? dashboardHref : tab.id === "projects" ? projectsHref : "#";
              const isActive = activeTab === tab.id;

              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={`cursor-pointer border-b pb-1 text-[17px] leading-none transition-colors ${
                    isActive
                      ? "text-orange-400 border-orange-500/90"
                      : "text-[#8f97a8] border-transparent hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[#a5aec2] transition-colors hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={15} />
          </button>
          <button
            type="button"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[#a5aec2] transition-colors hover:text-white"
            aria-label="Settings"
          >
            <Settings size={15} />
          </button>
          <button
            type="button"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-[#10151f] text-[#a5aec2] transition-colors hover:text-white"
            aria-label="Profile"
          >
            <UserCircle2 size={14} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}