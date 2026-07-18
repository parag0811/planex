"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0F0F11] border-t border-[#151515]">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-14 lg:gap-20">
          {/* Brand */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="text-white text-[30px] font-semibold tracking-tight"
            >
              PLANEX
            </Link>

            <div className="mt-8 space-y-4">
              <p className="text-[12px] leading-relaxed text-[#8a8a8a]">
                Planex is the architect's tool for defining full-stack architectures, databases, and APIs effortlessly.
              </p>
              <p className="text-[12px] leading-relaxed text-[#8a8a8a]">
                Stop planning in your head. Start designing robust systems before you write a single line of code.
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#5c5c5c] pt-2">
                Engineered for developers.
              </p>
            </div>
          </div>

          {/* Single Links Column */}
          <div>
            <h3 className="mb-6 text-[11px] uppercase tracking-[0.35em] text-[#ff7b00]">
              Links
            </h3>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/projects"
                  className="text-[11px] uppercase tracking-[0.25em] text-[#d1d1d1] hover:text-white transition-colors duration-200"
                >
                  WORKSPACE
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/parag0811/planex"
                  target="_blank"
                  className="text-[11px] uppercase tracking-[0.25em] text-[#d1d1d1] hover:text-white transition-colors duration-200"
                >
                  GITHUB
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-16 border-t border-[#151515]" />

        {/* Bottom */}
        <div className="pt-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#22c55e]" />

              <span className="text-[9px] uppercase tracking-[0.3em] text-[#727272]">
                All Systems Operational
              </span>
            </div>

            <p className="text-[9px] uppercase tracking-[0.25em] text-[#4f4f4f]">
              © {new Date().getFullYear()} Planex Architectural Systems. Designed For Developers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

