"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, Settings, User, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/src/store/slices/authSlice";
import type { RootState } from "@/src/store/store";

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isProjectsPage = pathname?.includes("projects");

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

  // Nav links — only shown when logged in and on projects page
  const authedNavLinks =
    isAuth && isProjectsPage ? (
      <nav className="hidden md:flex items-center gap-8">
        <Link
          href="/projects"
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#fafafa] hover:text-[#ff3d00] transition-colors duration-150"
        >
          Projects
        </Link>
        <Link
          href="#"
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#737373] hover:text-[#fafafa] transition-colors duration-150"
        >
          Workspace
        </Link>
      </nav>
    ) : null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 h-14 flex items-center justify-between gap-6">
          {/* Wordmark */}
          <Link href="/" className="shrink-0 group">
            <span
              className="font-black text-[15px] tracking-[-0.04em] text-[#fafafa] group-hover:text-[#ff3d00] transition-colors duration-150"
              style={{
                fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
              }}
            >
              PLANEX
            </span>
          </Link>

          {/* Center nav — logged-in + projects page only */}
          {authedNavLinks}

          {/* Right side */}
          <div
            className="relative flex items-center gap-4 ml-auto"
            ref={menuRef}
          >
            {/* Guest — show LOGIN button only */}
            {!isAuth && (
              <Link
                href="/login"
                className="relative inline-flex items-center gap-1.5 px-5 py-2 border bg-[#ff3d00] border-[#ff3d00] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] transition-all duration-150 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                }}
              >
                Login
              </Link>
            )}

            {/* Authenticated user menu */}
            {isAuth && (
              <div className="flex items-center gap-2">
                {/* Avatar + chevron pill */}
                <div className="flex items-center gap-1 border border-[#262626] bg-[#1a1a1a] px-1.5 py-1.5">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="relative flex h-7 w-7 items-center justify-center overflow-hidden border border-[#262626] bg-[#0f0f0f] text-[9px] font-bold text-[#ff3d00] hover:border-[#ff3d00]/50 transition-colors duration-150"
                    aria-label="Go to profile"
                  >
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt={user?.name ? `${user.name} avatar` : "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {avatarInitials}
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center justify-center p-1 text-[#737373] hover:text-[#fafafa] transition-colors duration-150"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Open account menu"
                  >
                    <ChevronDown
                      size={13}
                      strokeWidth={1.5}
                      className={`transition-transform duration-150 ${menuOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
                      className="absolute right-0 top-[calc(100%+0.75rem)] w-60 overflow-hidden border border-[#262626] bg-[#0f0f0f] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
                      role="menu"
                    >
                      {/* User info */}
                      <div className="border-b border-[#262626] px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[#262626] bg-[#1a1a1a] text-[10px] font-bold text-[#ff3d00]">
                            {avatarSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarSrc}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span
                                style={{
                                  fontFamily: '"JetBrains Mono", monospace',
                                }}
                              >
                                {avatarInitials}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-semibold text-[#fafafa]"
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
                              className="truncate text-[11px] text-[#737373]"
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                letterSpacing: "0.02em",
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
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#fafafa] hover:bg-[#1a1a1a] transition-colors duration-150"
                          role="menuitem"
                        >
                          <User
                            size={14}
                            strokeWidth={1.5}
                            className="text-[#ff3d00] shrink-0"
                          />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#fafafa] hover:bg-[#1a1a1a] transition-colors duration-150"
                          role="menuitem"
                        >
                          <Settings
                            size={14}
                            strokeWidth={1.5}
                            className="text-[#ff3d00] shrink-0"
                          />
                          <span>Settings</span>
                        </Link>
                        <div className="my-1 border-t border-[#262626]" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] text-[#ef4444] hover:bg-[#1a1a1a] transition-colors duration-150"
                          role="menuitem"
                        >
                          <LogOut
                            size={14}
                            strokeWidth={1.5}
                            className="shrink-0"
                          />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile hamburger — only when logged in on projects page */}
            {isAuth && isProjectsPage && (
              <button
                type="button"
                className="md:hidden flex items-center justify-center p-1.5 text-[#737373] hover:text-[#fafafa] transition-colors duration-150"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? (
                  <X size={18} strokeWidth={1.5} />
                ) : (
                  <Menu size={18} strokeWidth={1.5} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav drawer — logged in + projects page */}
        <AnimatePresence>
          {mobileNavOpen && isAuth && isProjectsPage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
              className="overflow-hidden border-t border-[#262626] bg-[#0a0a0a] md:hidden"
            >
              <nav className="flex flex-col px-6 py-4 gap-1">
                <Link
                  href="/projects"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-0 py-3 border-b border-[#262626] text-[11px] font-bold uppercase tracking-[0.18em] text-[#fafafa]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Projects
                </Link>
                <Link
                  href="#"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-0 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#737373]"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Workspace
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
