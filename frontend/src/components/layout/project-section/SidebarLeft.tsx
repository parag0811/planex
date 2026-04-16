"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Lightbulb, Database,
  Code2, FolderTree, ChevronRight,
  Menu, X, Flame,
} from "lucide-react";

export type SidebarPage =
  | "overview"
  | "idea"
  | "db-schema"
  | "api-design"
  | "folder";

interface SidebarProps {
  projectId: string;
  projectName?: string;
  projectStatus?: string;
}

const NAV_ITEMS: { id: SidebarPage; label: string; icon: React.ElementType; href: (projectId: string) => string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: (projectId) => `/projects/${projectId}` },
  { id: "idea", label: "Idea", icon: Lightbulb, href: (projectId) => `/projects/${projectId}/idea` },
  { id: "db-schema", label: "DB Schema", icon: Database, href: (projectId) => `/projects/${projectId}/database` },
  { id: "api-design", label: "API Design", icon: Code2, href: (projectId) => `/projects/${projectId}/api` },
  { id: "folder", label: "Folder", icon: FolderTree, href: (projectId) => `/projects/${projectId}/folder` },
];

export default function Sidebar({
  projectId,
  projectName = "Project Forge",
  projectStatus = "Active",
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActiveRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4.5 pt-5 pb-4.5 shrink-0">
        <div className="w-9 h-9 rounded-[10px] bg-linear-to-br from-orange-500 to-orange-700 flex items-center justify-center text-[#0f0800] shrink-0">
          <Flame size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-[0.12em] text-[#f0ebe3] leading-none font-rajdhani">
            FORGE
          </span>
          <span className="text-[9px] text-orange-500/60 tracking-[0.08em] mt-0.5 font-mono">
            v2.4.0-ALPHA
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col px-2.5 py-3.5 gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const href = item.href(projectId);
          const isActive = isActiveRoute(href);
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.1 }}
              onClick={() => {
                router.push(href);
                setMobileOpen(false);
              }}
              className={`
                relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left
                text-[13.5px] font-semibold tracking-[0.04em] transition-colors duration-200
                ${isActive
                  ? "text-orange-500"
                  : "text-white/40 hover:text-white/65 hover:bg-white/4"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-lg bg-orange-500/10 border border-orange-500/20"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon size={14} className="relative z-10 shrink-0" />
              <span className="relative z-10 flex-1">{item.label}</span>
              <ChevronRight
                size={11}
                className={`relative z-10 text-orange-500/50 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
              />
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-2.5 px-4.5 py-4 border-t border-white/6 shrink-0">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0 animate-pulse" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white/65 truncate">{projectName}</p>
          <p className="text-[9px] text-green-500 tracking-widest uppercase font-mono">{projectStatus}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-55 shrink-0 h-screen sticky top-0 bg-[rgba(12,7,2,0.97)] border-r border-white/6 backdrop-blur-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3.5 left-3.5 z-50 flex items-center justify-center bg-orange-500/15 border border-orange-500/30 rounded-lg p-2 text-orange-500"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 bottom-0 w-60 z-50 bg-[#0c0702] border-r border-white/8"
            >
              <button
                className="absolute top-3.5 right-3.5 bg-white/[0.07] border-none rounded-md p-1.5 text-white/50 z-10 flex"
                onClick={() => setMobileOpen(false)}
              >
                <X size={16} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}