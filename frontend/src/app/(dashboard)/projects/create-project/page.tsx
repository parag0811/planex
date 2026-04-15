"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3, Home, LayoutGrid, AlertTriangle,
  Clock, Shield, Cpu, ArrowRight, Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createProject } from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const NAV_ITEMS = [
  { icon: Home,          label: "Home"    },
  { icon: LayoutGrid,    label: "Grid"    },
  { icon: AlertTriangle, label: "Alerts"  },
  { icon: Clock,         label: "History" },
];

export default function ForgeArchitectOnboarding() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const createState = useSelector((state: RootState) => state.project.create);
  const [projectName, setProjectName]     = useState("");
  const [isFocused, setIsFocused]         = useState(false);
  const [isInitializing, setIsInit]       = useState(false);
  const [scanLine, setScanLine]           = useState(0);
  const [clientError, setClientError]     = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setScanLine((p) => (p + 1) % 100), 30);
    return () => clearInterval(id);
  }, []);

  const validateProjectName = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Project name is required.";
    }

    if (trimmed.length < 3) {
      return "Project name must be at least 3 characters.";
    }

    if (trimmed.length > 50) {
      return "Project name must be 50 characters or fewer.";
    }

    return null;
  };

  const handleInitialize = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateProjectName(projectName);

    if (validationMessage) {
      setClientError(validationMessage);
      return;
    }

    setClientError(null);
    setIsInit(true);

    try {
      await dispatch(createProject({ name: projectName.trim() })).unwrap();
      router.push("/projects");
    } catch (error) {
      setIsInit(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 20% 50%, #2a1200 0%, #0f0800 40%, #080500 100%)",
        fontFamily: "'Rajdhani', sans-serif",
        color: "#e0d5c5",
      }}
    >
      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-1 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scanline */}
      <div
        className="fixed left-0 right-0 h-px pointer-events-none z-2"
        style={{
          top: `${scanLine}%`,
          background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.08), transparent)",
          transition: "top 0.03s linear",
        }}
      />

      {/* Top Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex justify-center px-6 pt-5"
      >
        <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-full px-4 py-2 backdrop-blur-xl">
          <div className="flex gap-1">
            {NAV_ITEMS.map(({ icon: Icon, label }, i) => (
              <motion.button
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                aria-label={label}
                className="flex items-center text-white/35 px-2.5 py-1.5 rounded-full transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/10 border-none bg-transparent cursor-pointer"
              >
                <Icon size={14} />
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1.5 bg-orange-500/12 border border-orange-500/30 rounded-full px-3.5 py-1.25 text-orange-500 font-mono text-[11px] font-semibold tracking-[0.08em]"
          >
            <Zap size={12} />
            <span>ML RISK SCORE: 85%</span>
          </motion.div>
        </div>
      </motion.nav>

      {/* Main */}
      <main className="flex-1 flex items-center gap-10 px-6 py-10 sm:px-10 md:px-16 relative z-5 max-w-275 w-full mx-auto
        flex-col md:flex-row
      ">
        {/* Left panel */}
        <motion.aside
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-col justify-between gap-8 w-full md:w-70 md:shrink-0"
        >
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[11px] tracking-[0.2em] font-semibold text-white/35 mb-3 font-mono"
            >
              SYSTEM READY
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-bold leading-[1.05] tracking-[0.02em] mb-6"
              style={{ fontSize: "clamp(38px, 5vw, 56px)" }}
            >
              <span className="text-[#f0ebe3]">FORGE</span>
              <br />
              <span className="text-orange-500">ARCHITECT</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="hidden sm:block bg-white/3 border border-white/[0.07] rounded-[10px] p-4"
            >
              <p className="text-[13px] leading-[1.7] text-white/45 font-normal">
                You are initializing a new neural workspace. The Kinetic Architect
                protocol ensures all dependencies are pre-mapped for high-performance
                execution.
              </p>
            </motion.div>
          </div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:flex-col"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/15 text-orange-500 border border-orange-500/25">
                <Zap size={13} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-widest text-white/70 font-mono">NODE: ALPHA-7</p>
                <p className="text-[10px] tracking-[0.06em] text-white/30 font-mono">LATENCY: 12MS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-400/12 text-blue-400 border border-blue-400/20">
                <Cpu size={13} />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-widest text-white/70 font-mono">COMPUTE: ALLOCATED</p>
                <p className="text-[10px] tracking-[0.06em] text-white/30 font-mono">32GB SHARED VRAM</p>
              </div>
            </div>
          </motion.div>
        </motion.aside>

        {/* Right panel */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative flex-1 w-full bg-white/2.5 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-lg"
        >
          {/* Corner brackets */}
          {[
            "absolute top-[-1px] left-[-1px] border-t-2 border-l-2 rounded-tl-sm",
            "absolute top-[-1px] right-[-1px] border-t-2 border-r-2 rounded-tr-sm",
            "absolute bottom-[-1px] left-[-1px] border-b-2 border-l-2 rounded-bl-sm",
            "absolute bottom-[-1px] right-[-1px] border-b-2 border-r-2 rounded-br-sm",
          ].map((cls, i) => (
            <div key={i} className={`${cls} w-3 h-3 border-orange-500/40`} />
          ))}

          <form onSubmit={handleInitialize} className="p-6 sm:p-9 flex flex-col gap-9">
            {/* Project Name Field */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] tracking-[0.18em] font-semibold text-white/45 font-mono">
                  PROJECT NAME
                </label>
                <span className="text-[10px] tracking-widest text-orange-500/50 font-mono">01_INIT_10</span>
              </div>

              <motion.div
                animate={{
                  boxShadow: isFocused
                    ? "0 0 0 1px #f97316, 0 0 20px rgba(249,115,22,0.15)"
                    : "0 0 0 1px rgba(255,255,255,0.07)",
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 bg-black/30 rounded-[10px] px-4 py-3.5 cursor-text"
              >
                <Edit3 size={15} className="text-white/25 shrink-0" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g. Project Obsidian"
                  className="flex-1 bg-transparent border-none outline-none text-base font-medium text-white/85 tracking-[0.02em] placeholder:text-white/20"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                />
                <AnimatePresence>
                  {projectName && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-1.75 h-1.75 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {(clientError || createState.error) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[12px] leading-relaxed text-rose-300"
                  >
                    {clientError ?? createState.error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Button */}
            <div className="flex flex-col gap-3.5">
              <motion.button
                type="submit"
                disabled={!projectName.trim() || isInitializing || createState.loading}
                whileHover={projectName.trim() ? { scale: 1.01 } : {}}
                whileTap={projectName.trim() ? { scale: 0.99 } : {}}
                className={`
                  relative w-full py-4.5 px-6 rounded-[10px] overflow-hidden
                  text-[15px] font-bold tracking-[0.18em] text-[#0f0800]
                  transition-all duration-200
                  ${!projectName.trim() ? "opacity-35 cursor-not-allowed saturate-[0.4]" : "cursor-pointer"}
                  ${isInitializing || createState.loading ? "cursor-wait" : ""}
                `}
                style={{ background: "linear-gradient(135deg, #f97316 0%, #ea6600 100%)" }}
              >
                {/* Gloss */}
                <div className="absolute inset-0 bg-linear-to-br from-white/15 to-transparent pointer-events-none" />
                <AnimatePresence mode="wait">
                  {isInitializing || createState.loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2.5"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-[#0f0800]/30 border-t-[#0f0800] animate-spin" />
                      <span>CREATING...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2.5"
                    >
                      <span>CREATE WORKSPACE</span>
                      <ArrowRight size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <p className="text-center text-[10px] tracking-[0.06em] text-white/20 font-mono leading-relaxed">
                BY CLICKING INITIALIZE, YOU AGREE TO THE FORGE NEURAL PROTOCOLS V2.4.0
              </p>
            </div>
          </form>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 flex justify-between items-center px-6 sm:px-8 py-3.5 border-t border-white/5 flex-wrap gap-2.5"
      >
        <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-white/25 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)] animate-pulse" />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="flex gap-7 flex-wrap">
          {[
            { icon: Shield, label: "ENCRYPTION", value: "SHA-256 ACTIVE" },
            { icon: Cpu,    label: "KERNEL",     value: "v2.4.0-ALPHA"   },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 text-orange-500/50">
              <Icon size={11} />
              <div>
                <p className="text-[9px] tracking-[0.12em] text-white/25 font-mono">{label}</p>
                <p className="text-[10px] tracking-widest text-orange-500 font-mono">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.footer>
    </div>
  );
}