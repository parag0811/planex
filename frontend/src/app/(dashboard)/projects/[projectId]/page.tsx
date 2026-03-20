"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Users,
  Copy,
  RefreshCw,
  Check,
  Link2,
  Edit3,
  ArrowRight,
  Boxes,
  Zap,
  PackageOpen,
  Lightbulb,
  Database,
  Code2,
  FolderTree,
  AlertCircle,
  Clock,
  LayoutDashboard,
} from "lucide-react";

// Types
type SidebarPage =
  | "overview"
  | "idea"
  | "db-schema"
  | "api-design"
  | "folder-structure";

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  lastAction: string;
  timeAgo: string;
  online: boolean;
}

interface ProjectData {
  name: string;
  description: string;
  status: "conceptual" | "active" | "paused";
  teamMembers: TeamMember[];
}

// Mock Data
const MOCK_TEAM: TeamMember[] = [
  {
    id: "1",
    name: "Alex Chen",
    initials: "AC",
    avatarColor: "#f97316",
    lastAction: "Updated project description",
    timeAgo: "2 MIN AGO",
    online: true,
  },
  {
    id: "2",
    name: "Sarah Miller",
    initials: "SM",
    avatarColor: "#60a5fa",
    lastAction: "Exported schema notes",
    timeAgo: "1 HR AGO",
    online: true,
  },
  {
    id: "3",
    name: "Raj Patel",
    initials: "RP",
    avatarColor: "#a78bfa",
    lastAction: "Reviewed folder structure",
    timeAgo: "3 HRS AGO",
    online: false,
  },
];

const FILLED: ProjectData = {
  name: "Project Obsidian",
  description:
    "A distributed neural processing platform for real-time edge inference. Targeting sub-10ms latency with 99.99% uptime across 14 geo-distributed clusters.",
  status: "active",
  teamMembers: MOCK_TEAM,
};

const EMPTY: ProjectData = {
  name: "Unnamed Project",
  description: "",
  status: "conceptual",
  teamMembers: [],
};

const NAV_ITEMS: { id: SidebarPage; label: string; icon: React.ElementType }[] =
  [
    { id: "idea", label: "Idea", icon: Lightbulb },
    { id: "db-schema", label: "DB Schema", icon: Database },
    { id: "api-design", label: "API Design", icon: Code2 },
    { id: "folder-structure", label: "Folder Structure", icon: FolderTree },
  ];

// Animation helpers
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE } as Transition,
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, delay } as Transition,
});

// Stat Card
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2 group hover:border-white/[0.13] hover:bg-white/[0.045] transition-all duration-300 overflow-hidden"
    >
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${color}08 0%, transparent 70%)`,
        }}
      />
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${color}15`,
          border: `1px solid ${color}25`,
          color,
        }}
      >
        <Icon size={15} />
      </div>
      <div>
        <p className="text-[9px] text-white/28 tracking-[0.16em] font-mono uppercase mb-1">
          {label}
        </p>
        <p className="text-[30px] font-bold text-[#f0ebe3] leading-none tracking-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-white/25 mt-1 font-mono tracking-[0.04em]">
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Invite Panel
function InvitePanel({
  link,
  onRegenerate,
}: {
  link: string;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Link2 size={12} className="text-orange-500" />
          <span className="text-[10px] tracking-[0.15em] text-white/38 font-mono">
            INVITE LINK
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onRegenerate}
          className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white/32 cursor-pointer transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/[0.07] hover:border-orange-500/18"
        >
          <RefreshCw size={11} />
          <span>Regenerate</span>
        </motion.button>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLink(!showLink)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-[12px] font-semibold tracking-[0.04em] bg-white/[0.04] border border-white/[0.07] text-white/40 cursor-pointer transition-all duration-200 hover:text-white/72 hover:bg-white/[0.065]"
        >
          <Link2 size={12} />
          <span>{showLink ? "Hide Link" : "Show Link"}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-[12px] font-semibold tracking-[0.04em] bg-orange-500/[0.09] border border-orange-500/20 text-orange-500 cursor-pointer transition-all duration-200 hover:bg-orange-500/[0.16] hover:border-orange-500/30"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="c"
                {...fadeIn()}
                className="flex items-center gap-1.5"
              >
                <Check size={12} />
                <span>Copied!</span>
              </motion.span>
            ) : (
              <motion.span
                key="d"
                {...fadeIn()}
                className="flex items-center gap-1.5"
              >
                <Copy size={12} />
                <span>Copy Link</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {showLink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-black/30 border border-white/[0.06] rounded-xl px-3.5 py-2.5 mt-0.5">
              <span className="text-[11px] text-orange-400/60 font-mono break-all leading-relaxed">
                {link}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Empty State
function EmptyState({ onConfigure }: { onConfigure: () => void }) {
  return (
    <motion.div
      {...fadeUp(0.1)}
      className="flex flex-col items-center text-center py-20 px-6 bg-white/[0.012] border border-dashed border-white/[0.08] rounded-2xl gap-5"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 22 }}
        className="w-[60px] h-[60px] rounded-2xl bg-orange-500/[0.09] border border-orange-500/18 flex items-center justify-center"
      >
        <PackageOpen size={28} className="text-orange-500/80" />
      </motion.div>

      <motion.div {...fadeUp(0.25)} className="flex flex-col gap-2">
        <h3 className="text-[18px] font-bold text-white/60">
          No Project Data Yet
        </h3>
        <p className="text-[13px] text-white/25 max-w-[340px] leading-[1.7]">
          This workspace is freshly initialized. Add a description and configure
          your project to get started.
        </p>
      </motion.div>

      <motion.button
        {...fadeUp(0.35)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onConfigure}
        className="flex items-center gap-2 mt-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 text-[#0f0800] text-[13px] font-bold tracking-[0.08em] border-none cursor-pointer shadow-[0_0_24px_rgba(249,115,22,0.18)]"
      >
        <Edit3 size={13} />
        <span>Configure Project</span>
      </motion.button>
    </motion.div>
  );
}

// Page
export default function ProjectOverviewPage() {
  const [isEmpty, setIsEmpty] = useState(false);
  const [inviteLink, setInviteLink] = useState(
    "https://forge.app/invite/obs-7f3a-9d2c",
  );

  const project = isEmpty ? EMPTY : FILLED;

  const statusColor = {
    conceptual: "#f97316",
    active: "#22c55e",
    paused: "#60a5fa",
  }[project.status];

  const handleRegenerate = () => {
    const rand = Math.random().toString(36).substring(2, 10);
    setInviteLink(`https://forge.app/invite/${rand}`);
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0 min-h-screen"
      style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e0d5c5" }}
    >
      {/* Sub-nav */}
      <motion.div
        {...fadeIn(0)}
        className="flex items-center justify-between px-7 py-2 border-b border-white/[0.04] flex-wrap gap-2 pl-14 md:pl-7"
      >
        <div className="flex gap-1">
          {[Boxes, LayoutDashboard, AlertCircle, Clock].map((Icon, i) => (
            <button
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-white/28 flex cursor-pointer transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/[0.07] hover:border-orange-500/15"
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-orange-500/[0.08] border border-orange-500/18 rounded-full px-3 py-1 font-mono text-[10px] text-orange-500 tracking-[0.08em]">
          <Zap size={10} />
          <span>ML Risk Score: 85%</span>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-7 px-7 py-9">
        {/* Page heading */}
        <motion.div
          {...fadeUp(0.06)}
          className="flex justify-between items-start gap-5 flex-wrap"
        >
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[9px] tracking-[0.22em] font-mono uppercase px-2.5 py-1 rounded-full border"
                style={{
                  color: statusColor,
                  borderColor: `${statusColor}28`,
                  background: `${statusColor}0e`,
                }}
              >
                {project.status}
              </span>
            </div>

            <h1
              className="font-bold leading-[1.0] mb-4"
              style={{
                fontSize: "clamp(30px, 4vw, 52px)",
                background:
                  "linear-gradient(90deg, #c2410c 0%, #f97316 45%, #fdba74 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Project Overview
            </h1>

            {project.description ? (
              <p className="text-[13.5px] leading-[1.78] text-white/38 max-w-[500px]">
                {project.description}
              </p>
            ) : (
              <p className="text-[13px] text-white/18 italic">
                No description added yet.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 items-end shrink-0">
            {project.description && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 text-[#0f0800] text-[13px] font-bold tracking-[0.08em] border-none cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.15)]"
              >
                <Edit3 size={13} />
                <span>Edit Project</span>
              </motion.button>
            )}
            <button
              onClick={() => setIsEmpty(!isEmpty)}
              className="text-[10px] font-mono text-white/20 tracking-[0.06em] bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 cursor-pointer hover:text-white/42 transition-colors"
            >
              {isEmpty ? "Show Filled" : "Show Empty"}
            </button>
          </div>
        </motion.div>

        {/* Content switch */}
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-5"
            >
              <EmptyState onConfigure={() => setIsEmpty(false)} />
              <motion.div {...fadeUp(0.4)} className="max-w-sm">
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5">
                  <InvitePanel
                    link={inviteLink}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-5"
            >
              {/* Stat cards - only Team Members and Workspace Nodes */}
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <StatCard
                  icon={Users}
                  label="Team Members"
                  value={String(project.teamMembers.length)}
                  sub="Active collaborators"
                  color="#f97316"
                  delay={0.1}
                />
                <StatCard
                  icon={Boxes}
                  label="Workspace Nodes"
                  value="14"
                  sub="Geo-distributed"
                  color="#60a5fa"
                  delay={0.15}
                />
              </div>

              {/* Bottom cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Team Activity */}
                <motion.div
                  {...fadeUp(0.22)}
                  className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.11] transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-[26px] h-[26px] rounded-lg bg-orange-500/10 border border-orange-500/18 flex items-center justify-center">
                        <Users size={12} className="text-orange-500" />
                      </div>
                      <span className="text-[10px] tracking-[0.15em] text-white/35 font-mono">
                        TEAM ACTIVITY
                      </span>
                    </div>
                    <button className="text-[10px] text-orange-500/70 font-mono tracking-[0.06em] bg-transparent border-none cursor-pointer hover:text-orange-500 transition-colors">
                      View Log
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {project.teamMembers.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.07 }}
                        className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors duration-200"
                      >
                        <div
                          className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{
                            background: `${m.avatarColor}18`,
                            border: `1px solid ${m.avatarColor}30`,
                            color: m.avatarColor,
                          }}
                        >
                          {m.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] truncate leading-snug">
                            <span className="font-bold text-white/75">
                              {m.name}
                            </span>
                            <span className="text-white/32">
                              {" "}
                              {m.lastAction}
                            </span>
                          </p>
                          <p className="text-[9px] text-white/20 font-mono tracking-[0.06em] mt-0.5">
                            {m.timeAgo}
                          </p>
                        </div>
                        {m.online ? (
                          <div className="w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)] shrink-0" />
                        ) : (
                          <div className="w-[6px] h-[6px] rounded-full bg-white/15 shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Invite + Continue Setup */}
                <motion.div
                  {...fadeUp(0.27)}
                  className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.11] transition-all duration-300"
                >
                  <InvitePanel
                    link={inviteLink}
                    onRegenerate={handleRegenerate}
                  />

                  <div className="flex flex-col gap-0.5 border-t border-white/[0.05] pt-4">
                    <p className="text-[9px] text-white/20 tracking-[0.18em] font-mono mb-2 uppercase">
                      Continue Setup
                    </p>
                    {NAV_ITEMS.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.32 + i * 0.06 }}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-transparent border-none cursor-pointer text-[13px] font-semibold text-white/32 w-full text-left transition-all duration-200 hover:text-white/65 hover:bg-white/[0.035] group"
                        >
                          <Icon
                            size={13}
                            className="text-orange-500/38 group-hover:text-orange-500 transition-colors duration-200"
                          />
                          <span>{item.label}</span>
                          <ArrowRight
                            size={11}
                            className="ml-auto text-white/15 group-hover:text-orange-400 transition-all duration-200 group-hover:translate-x-0.5"
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        {...fadeIn(0.5)}
        className="px-7 py-3 border-t border-white/[0.04] flex justify-between flex-wrap gap-2 text-[9px] text-white/14 font-mono tracking-[0.06em]"
      >
        <span>FORGE NEURAL CORE — REAL-TIME PREDICTIVE ANALYSIS ENABLED</span>
        <span>MD5_HASH: F8A3B92...C2D</span>
      </motion.footer>
    </div>
  );
}
