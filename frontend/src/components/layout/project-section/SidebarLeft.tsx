"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  Lightbulb,
  Database,
  Code2,
  FolderTree,
  Menu,
  X,
  AppWindow,
} from "lucide-react";
import type { RootState } from "@/src/store/store";

export type SidebarPage =
  | "dashboard"
  | "idea"
  | "api"
  | "database"
  | "folder";

interface SidebarProps {
  projectId: string;
  projectName?: string;
  projectStatus?: string;
}

const NAV_ITEMS: { id: SidebarPage; label: string; icon: React.ElementType; href: (projectId: string) => string }[] = [
  { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard, href: (projectId) => `/projects/${projectId}` },
  { id: "idea", label: "IDEA", icon: Lightbulb, href: (projectId) => `/projects/${projectId}/idea` },
  { id: "database", label: "DATABASE", icon: Database, href: (projectId) => `/projects/${projectId}/database` },
  { id: "api", label: "API", icon: Code2, href: (projectId) => `/projects/${projectId}/api` },
  { id: "folder", label: "FOLDER", icon: FolderTree, href: (projectId) => `/projects/${projectId}/folder` },
];

export default function Sidebar({
  projectId,
  projectName = "Project Forge",
  projectStatus = "Active",
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const displayName = user?.name || user?.fullName || user?.username || "Logged In User";
  const displayEmail = user?.email || "No email linked";
  const avatarInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();

  const isActiveRoute = (item: (typeof NAV_ITEMS)[number]) => {
    const href = item.href(projectId);

    if (item.id === "dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-hidden bg-[#06070c]">
      {/* Brand */}
      <div className="border-b border-white/5 px-3 py-4 shrink-0">
        <div className="flex items-start gap-2.5 rounded-sm bg-[#0d1118] px-3 py-2.5">
          <div className="grid h-5.5 w-5.5 place-items-center rounded-[3px] bg-orange-500 text-[#120900]">
            <AppWindow size={12} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold tracking-[0.04em] text-white">
              {projectName.replace(/\s+/g, "_")}
            </p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-[#7d8698]">
              v0.4.2-alpha
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item);
          const href = item.href(projectId);

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i + 0.05 }}
              onClick={() => {
                router.push(href);
                setMobileOpen(false);
              }}
              className={`
                mb-1 flex w-full cursor-pointer items-center gap-2 rounded-sm border-l-2 px-3 py-2.5 text-left
                text-[10px] font-bold tracking-[0.18em] transition-colors duration-150
                ${isActive
                  ? "border-orange-500 bg-white/6 text-orange-500"
                  : "border-transparent text-[#a3acbf] hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Icon size={12} className="shrink-0" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-sm border border-white/10 bg-[#0d1118] px-2.5 py-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#131925] text-[10px] font-bold text-orange-400">
            {avatarInitials || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-white/90">{displayName}</p>
            <p className="truncate text-[9px] text-[#8f99af]">{displayEmail}</p>
          </div>
        </div>
        <div className="mt-2 px-0.5 text-[8px] uppercase tracking-[0.18em] text-[#6f7788]">
          {projectStatus}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 border-r border-white/5 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-2.5 left-3 z-50 flex h-8 w-8 items-center justify-center rounded-md border border-orange-500/35 bg-orange-500/15 text-orange-500"
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
              className="fixed top-14 left-0 bottom-0 w-64 z-50 border-r border-white/8"
            >
              <button
                className="absolute right-2 top-2 z-10 flex rounded-md bg-white/[0.07] p-1.5 text-white/50"
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