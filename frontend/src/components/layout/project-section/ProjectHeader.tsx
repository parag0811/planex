"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";

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
  { label: "Recent", href: "/projects?filter=recent" },
  { label: "Templates", href: "/projects/templates" },
] as const;

export default function ProjectHeader({
  onMobileMenuToggle,
}: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

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
              className="text-[15px] font-black tracking-[-0.03em] text-white"
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

        {/* Right — search */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="hidden sm:flex items-center gap-2 border border-[#2b2321] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a6786d]/70 hover:text-[#a6786d] hover:border-[#a6786d]/30 transition-all duration-150"
            style={MONO}
            aria-label="Search"
          >
            <Search size={12} strokeWidth={1.5} />
            Search
          </button>
        </div>
      </div>
    </motion.header>
  );
}
