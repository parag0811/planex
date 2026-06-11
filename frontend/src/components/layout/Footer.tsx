"use client";

import Link from "next/link";

const footerLinks = {
  Product: ["Workspace", "Templates", "Pricing", "Roadmap"],
  Resources: ["Docs", "API Reference", "GitHub", "Community"],
  Social: ["Twitter / X", "LinkedIn"],
};

export default function Footer() {
  return (
    <footer className="bg-[#0F0F11] border-t border-[#151515]">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-14 lg:gap-20">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-white text-[30px] font-semibold tracking-tight"
            >
              PLANEX
            </Link>

            <div className="mt-8 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#5c5c5c]">
                Engineered for developers.
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#5c5c5c]">
                Building systems globally.
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-6 text-[11px] uppercase tracking-[0.35em] text-[#ff7b00]">
              Product
            </h3>

            <ul className="space-y-4">
              {footerLinks.Product.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[11px] uppercase tracking-[0.25em] text-[#d1d1d1] hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-6 text-[11px] uppercase tracking-[0.35em] text-[#ff7b00]">
              Resources
            </h3>

            <ul className="space-y-4">
              {footerLinks.Resources.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[11px] uppercase tracking-[0.25em] text-[#d1d1d1] hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-6 text-[11px] uppercase tracking-[0.35em] text-[#ff7b00]">
              Social
            </h3>

            <ul className="space-y-4">
              {footerLinks.Social.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[11px] uppercase tracking-[0.25em] text-[#d1d1d1] hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </Link>
                </li>
              ))}
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
              © 2026 Planex Architectural Systems. Designed For Developers.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="text-[9px] uppercase tracking-[0.3em] text-[#5f5f5f] hover:text-white transition-colors"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="text-[9px] uppercase tracking-[0.3em] text-[#5f5f5f] hover:text-white transition-colors"
            >
              Terms
            </Link>

            <Link
              href="/cookies"
              className="text-[9px] uppercase tracking-[0.3em] text-[#5f5f5f] hover:text-white transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
