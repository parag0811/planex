"use client";

import { Zap } from "lucide-react";
import Link from "next/link";

export default function ProjectsFooter() {
  const footerLinks = [
    { label: "Docs", href: "#" },
    { label: "Status", href: "#" },
    { label: "Support", href: "#" },
  ];

  return (
    <footer className="bg-[#06070c] border-t border-white/5 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#f97316] flex items-center justify-center">
              <Zap size={14} className="text-black fill-black" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight font-mono">
              PLANEX <span className="text-[#f97316]">AI</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[#8b93a6] hover:text-white text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6">
          <p className="text-[#6b7280] text-xs text-center">
            © 2026 <span className="text-white font-semibold">Planex AI</span> Infrastructure. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
