"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/src/store/slices/authSlice";
import {
  Lightbulb,
  Sparkles,
  Database,
  FolderOpen,
  User,
  X,
  LayoutDashboard,
  Settings,
  LogOut,
} from "lucide-react";
import type { RootState } from "@/src/store/store";

export type SidebarPage = "dashboard" | "idea" | "api" | "database" | "folder";

interface SidebarProps {
  projectId: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "OVERVIEW",
    icon: LayoutDashboard,
    href: (id: string) => `/projects/${id}`,
  },
  {
    id: "idea",
    label: "IDEA",
    icon: Lightbulb,
    href: (id: string) => `/projects/${id}/idea`,
  },
  {
    id: "database",
    label: "DB",
    icon: Database,
    href: (id: string) => `/projects/${id}/database`,
  },
  {
    id: "api",
    label: "API",
    icon: Sparkles,
    href: (id: string) => `/projects/${id}/api`,
  },
  {
    id: "folder",
    label: "FOLDER",
    icon: FolderOpen,
    href: (id: string) => `/projects/${id}/folder`,
  },
];

function RailContent({
  projectId,
  pathname,
  onNavigate,
  onLogout,
  displayName,
}: {
  projectId: string;
  pathname: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  displayName: string;
}) {
  const isActiveRoute = (item: (typeof NAV_ITEMS)[number]) => {
    const href = item.href(projectId);
    if (item.id === "dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-full flex-col bg-[#1c1c1c]">
      {/* Workspace label */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30"
          style={MONO}
        >
          Workspace
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item);
          const href = item.href(projectId);

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * i }}
              onClick={() => onNavigate(href)}
              className={`flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${isActive
                  ? "bg-[#2b2321] text-white"
                  : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]"
                }`}
            >
              <Icon
                size={15}
                strokeWidth={1.5}
                className={isActive ? "text-[#ff3d00]" : "text-white/35"}
              />
              <span
                className="text-[12px] font-semibold tracking-[0.04em] uppercase"
                style={INTER}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-[#2b2321] px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-6 w-6 items-center justify-center bg-[#2b2321] text-[#a6786d] shrink-0">
            <User size={12} strokeWidth={1.5} />
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 truncate"
            style={MONO}
            title={displayName}
          >
            {displayName}
          </span>
        </div>
        
        <div className="flex flex-col gap-0.5">
          <button 
            onClick={() => onNavigate('/profile')} 
            className="flex items-center gap-2.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 hover:text-white hover:bg-white/[0.03] transition-colors"
            style={INTER}
          >
            <User size={12} className="shrink-0" />
            Profile
          </button>
          <button 
            onClick={() => onNavigate('/settings')} 
            className="flex items-center gap-2.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 hover:text-white hover:bg-white/[0.03] transition-colors"
            style={INTER}
          >
            <Settings size={12} className="shrink-0" />
            Settings
          </button>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-400/60 hover:text-red-400 hover:bg-red-400/[0.03] transition-colors"
            style={INTER}
          >
            <LogOut size={12} className="shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  projectId,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const displayName = (() => {
    const name = user?.name || user?.username || "PLANNER_01";
    return String(name).toUpperCase().replace(/\s+/g, "_");
  })();

  const handleNavigate = (href: string) => {
    router.push(href);
    onMobileClose?.();
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    onMobileClose?.();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[220px] shrink-0 h-full relative border-r border-[#2b2321] z-20">
        <RailContent
          projectId={projectId}
          pathname={pathname}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          displayName={displayName}
        />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 h-[100dvh] w-[220px] z-50 border-r border-[#2b2321] md:hidden"
            >
              <button
                className="absolute right-3 top-4 flex h-6 w-6 items-center justify-center text-white/40 hover:text-white/70"
                onClick={onMobileClose}
                aria-label="Close menu"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
              <RailContent
                projectId={projectId}
                pathname={pathname}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                displayName={displayName}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
