"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/src/store/slices/authSlice";
import type { RootState } from "@/src/store/store";

const EASE: [number, number, number, number] = [0.25, 0, 0, 1];

const PROJECTS_NAV = [
  { label: "Projects", href: "/projects" },
  { label: "Templates", href: "/projects/templates" },
];

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isProjectsPage = pathname?.includes("projects");

  const isNavActive = (href: string) =>
    href === "/projects"
      ? pathname === "/projects"
      : pathname?.startsWith(href.split("?")[0]);

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
        setMobileNavOpen(false);
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#281D1B] bg-[#111111]/96 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 h-14 flex items-center justify-between gap-6">
          {/* Left — wordmark + projects nav */}
          <div className="flex items-center gap-10 min-w-0">
            {/* Mobile hamburger (projects page only) */}
            {isAuth && isProjectsPage && (
              <button
                type="button"
                className="md:hidden p-1 text-white/40 hover:text-white transition-colors duration-150"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? (
                  <X size={17} strokeWidth={1.5} />
                ) : (
                  <Menu size={17} strokeWidth={1.5} />
                )}
              </button>
            )}

            {/* Wordmark */}
            <Link href={"/"} className="shrink-0 group">
              <span
                className="font-semibold text-[26px] tracking-[-0.03em] text-white group-hover:text-white/70 transition-colors duration-150"
                style={{
                  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
                }}
              >
                PLANEX
              </span>
            </Link>

            {/* Desktop nav — projects pages only when logged in */}
            {isAuth && isProjectsPage && (
              <nav className="hidden md:flex items-center gap-6">
                {PROJECTS_NAV.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`relative pb-px text-[11px] uppercase tracking-[0.12em] transition-colors duration-150 ${
                      isNavActive(link.href)
                        ? "text-[#E09F8F]"
                        : "text-[#AD8B85] hover:text-white/65"
                    }`}
                    style={{
                      fontFamily: '"Inter Tight", system-ui, sans-serif',
                    }}
                  >
                    {link.label}
                    {isNavActive(link.href) && (
                      <span className="absolute -bottom-[4px] left-0 w-full h-px bg-[#ff3d00]" />
                    )}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right side */}
          <div
            className="relative flex items-center gap-4 ml-auto"
            ref={menuRef}
          >
            {/* Guest — LOGIN button */}
            {!isAuth && (
              <Link
                href="/login"
                className="inline-flex items-center px-5 py-2 bg-[#ff3d00] border border-[#ff3d00] text-white hover:bg-transparent hover:text-[#ff3d00] transition-all duration-150 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                }}
              >
                Login
              </Link>
            )}

            {/* Authenticated — search + avatar */}
            {isAuth && (
              <div className="flex items-center gap-4">
                {/* Avatar circle + dropdown */}
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
                              <span
                                style={{ fontFamily: '"Inter", sans-serif' }}
                              >
                                {avatarInitials}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-semibold text-white"
                              style={{
                                fontFamily:
                                  '"Inter Tight", "Inter", system-ui, sans-serif',
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
                          <User
                            size={13}
                            strokeWidth={1.5}
                            className="text-[#ff3d00] shrink-0"
                          />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-150"
                          role="menuitem"
                        >
                          <Settings
                            size={13}
                            strokeWidth={1.5}
                            className="text-[#ff3d00] shrink-0"
                          />
                          Settings
                        </Link>
                        <div className="my-1 border-t border-white/5" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] text-red-400 hover:bg-white/5 transition-colors duration-150"
                          role="menuitem"
                        >
                          <LogOut
                            size={13}
                            strokeWidth={1.5}
                            className="shrink-0"
                          />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav drawer — projects page only */}
        <AnimatePresence>
          {mobileNavOpen && isAuth && isProjectsPage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="overflow-hidden border-t border-white/5 bg-[#0a0a0a] md:hidden"
            >
              <nav className="flex flex-col px-4 py-2">
                {PROJECTS_NAV.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`py-3 border-b border-white/5 last:border-0 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 ${
                      isNavActive(link.href) ? "text-white" : "text-white/35"
                    }`}
                    style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile bottom tab bar — projects pages only */}
      {isAuth && isProjectsPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0a0a] md:hidden">
          <div className="grid grid-cols-5 h-14">
            {[
              { label: "Projects", href: "/projects" },
              { label: "Templates", href: "/projects/templates" },
              { label: "Alerts", href: "/projects/alerts" },
              { label: "Profile", href: "/profile" },
            ].map((item) => {
              const active = isNavActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                    active
                      ? "text-[#ff3d00]"
                      : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <span className="text-[15px] leading-none">
                    {item.label === "Projects"
                      ? "⊞"
                      : item.label === "Templates"
                        ? "▤"
                        : item.label === "Alerts"
                          ? "◎"
                          : "◯"}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase tracking-[0.1em]"
                    style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
