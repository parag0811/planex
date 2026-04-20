"use client";

import { Zap, Github, Twitter, Cpu } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Product: ["Features", "ML Risk Guard", "API Docs", "Status"],
  Company: ["About", "Privacy", "Terms", "Support"],
};

export default function Footer() {
  return (
    <footer className="bg-[#10141d] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#f97316] flex items-center justify-center">
                <Zap size={15} className="text-black fill-black" />
              </div>
              <span className="font-bold text-white text-[15px] tracking-tight font-mono">
                PLANEX <span className="text-[#f97316]">AI</span>
              </span>
            </Link>
            <p className="text-[#6b5c4c] text-sm leading-relaxed">
              The intelligent planning layer for software development. Build
              faster, plan better, and ship with clear architecture decisions.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="text-[#6b5c4c] hover:text-[#f97316] transition-colors">
                <Github size={17} />
              </a>
              <a href="#" className="text-[#6b5c4c] hover:text-[#f97316] transition-colors">
                <Twitter size={17} />
              </a>
              <a href="#" className="text-[#6b5c4c] hover:text-[#f97316] transition-colors">
                <Cpu size={17} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white text-sm font-semibold mb-4">{section}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#6b5c4c] hover:text-white text-sm transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[#4a3a2a] text-xs">
            © 2026 Planex AI Planning. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Github size={15} className="text-[#4a3a2a] hover:text-[#f97316] cursor-pointer transition-colors" />
            <Twitter size={15} className="text-[#4a3a2a] hover:text-[#f97316] cursor-pointer transition-colors" />
            <Cpu size={15} className="text-[#4a3a2a] hover:text-[#f97316] cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
}