"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogOut, Settings, User, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/src/store/slices/authSlice";
import type { RootState } from "@/src/store/store";

export default function Header() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const avatarSrc = useMemo(() => {
    if (!user) {
      return "";
    }

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
    if (!user) {
      return "IN";
    }

    const sourceName =
      user.name || user.fullName || user.username || user.email || "IN";

    const parts = String(sourceName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#11151f]/88 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-md bg-[#f97316] flex items-center justify-center">
            <Zap size={15} className="text-black fill-black" />
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight font-mono">
            PLANEX <span className="text-[#f97316]">AI</span>
          </span>
        </Link>

        <div className="relative flex items-center gap-3" ref={menuRef}>
          {!isAuth && (
            <Link
              href="/login"
              className="rounded-full bg-[#f97316] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ea6c0a]"
            >
              Login / Signup
            </Link>
          )}

          {isAuth && (
            <>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#141b28] px-1.5 py-1.5 text-left transition-colors hover:border-[#f97316]/45"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1a2130] text-[10px] font-bold text-[#f97316]">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt={user?.name ? `${user.name} profile picture` : "Profile picture"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{avatarInitials}</span>
                  )}
                </div>
                <ChevronDown
                  size={14}
                  className={`mr-1 text-[#8b93a6] transition-transform ${
                    menuOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#101722] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
                    role="menu"
                  >
                    <div className="border-b border-white/5 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1a2130] text-sm font-bold text-[#f97316]">
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarSrc}
                              alt={user?.name ? `${user.name} profile picture` : "Profile picture"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{avatarInitials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {user?.name || user?.fullName || user?.username || "Your account"}
                          </p>
                          <p className="truncate text-xs text-[#7f889d]">
                            {user?.email || "Signed in user"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#d8ddea] transition-colors hover:bg-white/5 hover:text-white"
                        role="menuitem"
                      >
                        <User size={16} className="text-[#f97316]" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#d8ddea] transition-colors hover:bg-white/5 hover:text-white"
                        role="menuitem"
                      >
                        <Settings size={16} className="text-[#f97316]" />
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#f5a3a0] transition-colors hover:bg-white/5 hover:text-[#ffb7b3]"
                        role="menuitem"
                      >
                        <LogOut size={16} className="text-[#f97316]" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
