"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";

const navLinks = [
  { label: "Workspace", href: "/workspace" },
  { label: "Documentation", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Community", href: "/community" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();
  const { isAuth, user } = useSelector((state: RootState) => state.auth);

  const ctaLabel = isAuth ? "Go to Projects" : "Get Started";
  const ctaHref = isAuth ? "/projects" : "/register";
  const hideProjectsCta = isAuth && pathname.startsWith("/projects");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1200]/80 backdrop-blur-md border-b border-white/5">
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

        {/* Nav - desktop */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-[#a89880] hover:text-white transition-colors duration-200 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div
          className={`hidden md:flex items-center gap-2 bg-white/5 border rounded-full px-4 py-2 transition-all duration-300 ${
            searchFocused
              ? "border-[#f97316]/50 bg-white/8 w-56"
              : "border-white/10 w-44"
          }`}
        >
          <Search size={13} className="text-[#a89880] shrink-0" />
          <input
            type="text"
            placeholder="Quick search..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent text-sm text-white placeholder-[#6b5c4c] outline-none w-full"
          />
        </div>

        {/* CTA + Avatar */}
        <div className="hidden md:flex items-center gap-3">
          {!hideProjectsCta && (
            <Link
              href={ctaHref}
              className="bg-[#f97316] hover:bg-[#ea6c0a] text-black text-sm font-bold px-5 py-2 rounded-full transition-all duration-200 hover:scale-[1.03]"
            >
              {ctaLabel}
            </Link>
          )}
          <div className="w-8 h-8 rounded-full bg-[#3a2a1a] border border-white/10 overflow-hidden cursor-pointer hover:border-[#f97316]/50 transition-colors flex items-center justify-center text-[10px] font-bold text-[#f97316]">
            {isAuth ? (user?.name ? String(user.name).slice(0, 2).toUpperCase() : "IN") : "GO"}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-[#1a1200] border-t border-white/5 px-6 py-5 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#a89880] hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!hideProjectsCta && (
              <Link
                href={ctaHref}
                className="bg-[#f97316] text-black text-sm font-bold px-5 py-2 rounded-full text-center"
                onClick={() => setMenuOpen(false)}
              >
                {ctaLabel}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
