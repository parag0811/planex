"use client";

import { motion } from "framer-motion";
import { Bell, Settings } from "lucide-react";

interface ProjectHeaderProps {
  projectName?: string;
}

export default function ProjectHeader({
  projectName = "Project Obsidian",
}: ProjectHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex justify-between items-center px-7 py-3.5 border-b border-white/[0.05] gap-4 flex-wrap pl-14 md:pl-7"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        <span className="text-white/28">Workspace</span>
        <span className="text-white/15 mx-0.5">/</span>
        <span className="text-white/65 font-semibold">{projectName}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {[Bell, Settings].map((Icon, i) => (
          <button
            key={i}
            className="bg-white/[0.04] border border-white/[0.07] rounded-[7px] p-[7px] text-white/38 flex cursor-pointer transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/20"
          >
            <Icon size={14} />
          </button>
        ))}
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-[10px] font-bold text-[#0f0800] tracking-[0.05em] cursor-pointer shrink-0">
          FO
        </div>
      </div>
    </motion.header>
  );
}