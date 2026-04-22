"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface ProjectHeaderProps {
  projectName?: string;
}

type SectionType = "overview" | "idea" | "database" | "api" | "folder";

const SECTION_LABELS: Record<SectionType, string> = {
  overview: "OVERVIEW",
  idea: "IDEA",
  database: "DATABASE",
  api: "API",
  folder: "FOLDER",
};

const SECTION_BUTTONS: Record<SectionType, { show: boolean; label?: string }> = {
  overview: { show: false },
  idea: { show: true, label: "SAVE" },
  database: { show: true, label: "SAVE" },
  api: { show: true, label: "SAVE" },
  folder: { show: true, label: "SAVE" },
};

export default function ProjectHeader({
  projectName = "Project Obsidian",
}: ProjectHeaderProps) {
  const pathname = usePathname();

  const getCurrentSection = (): SectionType => {
    if (pathname.includes("/idea")) return "idea";
    if (pathname.includes("/database")) return "database";
    if (pathname.includes("/api")) return "api";
    if (pathname.includes("/folder")) return "folder";
    return "overview";
  };

  const currentSection = getCurrentSection();
  const sectionLabel = SECTION_LABELS[currentSection];
  const buttonConfig = SECTION_BUTTONS[currentSection];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex justify-between items-center px-7 py-3 border-b border-white/[0.05] gap-4 flex-wrap pl-14 md:pl-7 bg-[#06070c]"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px]">
        <span className="text-white/30">PROJECTS</span>
        <span className="text-white/15 mx-1">/</span>
        <span className="text-white/60 font-semibold tracking-[0.02em]">{projectName}</span>
        <span className="text-white/15 mx-1">/</span>
        <span className="text-orange-500 font-semibold tracking-[0.02em]">{sectionLabel}</span>
      </div>

      {/* Actions - only show for section pages, not overview */}
      {buttonConfig.show && (
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 bg-orange-500 text-[#0f0800] rounded-lg text-[11px] font-bold tracking-[0.06em] hover:bg-orange-600 transition-all duration-200 cursor-pointer">
            {buttonConfig.label || "SAVE"}
          </button>
          <button className="text-white/40 hover:text-orange-500 transition-colors duration-200 cursor-pointer text-[11px] font-bold tracking-widest uppercase">
            AI COPILOT
          </button>
        </div>
      )}
    </motion.header>
  );
}