"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/src/store/slices/authSlice";
import type { RootState } from "@/src/store/store";

interface ProjectHeaderProps {
  projectName?: string;
  onMobileMenuToggle?: () => void;
}

const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};
const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};

const NAV_LINKS = [
  { label: "Projects", href: "/projects" },
] as const;

const EASE: [number, number, number, number] = [0.25, 0, 0, 1];

export default function ProjectHeader({
  onMobileMenuToggle,
}: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const avatarSrc = useMemo(() => {
    if (!user) return "";
    return (
      user.avatar ||
      user.avatarUrl ||
      user.image ||
      user.photoURL ||
      user.picture ||
      user.profilePic ||
      ""
    );
  }, [user]);

  const avatarInitials = useMemo(() => {
    if (!user) return "IN";
    const sourceName =
      user.name || user.fullName || user.username || user.email || "IN";
    const parts = String(sourceName).trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return String(sourceName).slice(0, 2).toUpperCase();
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
    router.push("/login");
  };

  const isNavActive = (href: string) =>
    href === "/projects"
      ? pathname === "/projects"
      : pathname.startsWith(href.split("?")[0]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 border-b border-[#2b2321] bg-[#131414]"
    >
      <div className="flex h-14 items-center justify-between gap-6 px-4 md:px-6">
        {/* Left — hamburger + wordmark */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden flex items-center justify-center text-[#a6786d]/70 hover:text-[#a6786d] transition-colors duration-150"
            aria-label="Toggle menu"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>

          <Link href="/projects" className="shrink-0 flex items-center gap-2">
            <span
              className="text-[20px] font-black tracking-[-0.03em] text-white hover:text-white/70 transition-colors duration-150"
              style={{
                fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
              }}
            >
              PLANEX
            </span>
          </Link>
        </div>

        {/* Center — nav links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-150 ${
                isNavActive(link.href)
                  ? "text-[#a6786d]"
                  : "text-[#a6786d]/45 hover:text-[#a6786d]/80"
              }`}
              style={MONO}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — Profile button */}
        <div className="hidden md:flex items-center gap-3 shrink-0" ref={menuRef}>
          <div className="relative flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full bg-[#ff3d00] text-[10px] font-semibold text-white overflow-hidden hover:opacity-85 transition-opacity duration-150 shrink-0"
              style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <span>{avatarInitials}</span>
              )}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  className="absolute right-0 top-[calc(100%+0.75rem)] w-60 overflow-hidden border border-white/10 bg-[#0f0f0f] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
                  role="menu"
                >
                  {/* User info */}
                  <div className="border-b border-white/5 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff3d00] text-[10px] font-bold text-white overflow-hidden">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span style={{ fontFamily: '"Inter", sans-serif' }}>
                            {avatarInitials}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-semibold text-white"
                          style={{
                            fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
                          }}
                        >
                          {user?.name ||
                            user?.fullName ||
                            user?.username ||
                            "Your account"}
                        </p>
                        <p
                          className="truncate text-[11px] text-white/35"
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                          }}
                        >
                          {user?.email || "Signed in"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-150"
                      role="menuitem"
                    >
                      <User size={13} strokeWidth={1.5} className="text-[#ff3d00] shrink-0" />
                      Profile
                    </Link>

                    <div className="my-1 border-t border-white/5" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] text-red-400 hover:bg-white/5 transition-colors duration-150"
                      role="menuitem"
                    >
                      <LogOut size={13} strokeWidth={1.5} className="shrink-0" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
