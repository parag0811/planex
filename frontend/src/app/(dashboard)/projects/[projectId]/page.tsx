"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  Bell,
  Settings,
  Search,
  Users,
  Copy,
  RefreshCw,
  Check,
  Link2,
  Edit3,
  ArrowRight,
  Boxes,
  Clock,
  Zap,
  AlertCircle,
  PackageOpen,
  Lightbulb,
  Database,
  Code2,
  FolderTree,
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
// ease cast to tuple so TS narrows it correctly
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE } as Transition,
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.35, delay } as Transition,
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
      className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-1.5 hover:border-white/[0.12] transition-colors duration-300"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 shrink-0"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}28`,
          color,
        }}
      >
        <Icon size={15} />
      </div>
      <p className="text-[9px] text-white/30 tracking-[0.14em] font-mono uppercase">
        {label}
      </p>
      <p className="text-[28px] font-bold text-[#f0ebe3] leading-none">
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/28">{sub}</p>}
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
          <span className="text-[10px] tracking-[0.15em] text-white/40 font-mono">
            INVITE LINK
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRegenerate}
          className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 text-[11px] font-semibold text-white/35 cursor-pointer transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/[0.08] hover:border-orange-500/20"
        >
          <RefreshCw size={11} />
          <span>Regenerate</span>
        </motion.button>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLink(!showLink)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-[12.5px] font-semibold tracking-[0.04em] bg-white/[0.04] border border-white/[0.08] text-white/45 cursor-pointer transition-all duration-200 hover:text-white/75 hover:bg-white/[0.07]"
        >
          <Link2 size={12} />
          <span>{showLink ? "Hide Link" : "Show Link"}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-[12.5px] font-semibold tracking-[0.04em] bg-orange-500/10 border border-orange-500/22 text-orange-500 cursor-pointer transition-all duration-200 hover:bg-orange-500/18"
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
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="bg-black/35 border border-white/[0.06] rounded-lg px-3.5 py-2.5 mt-1">
              <span className="text-[11px] text-orange-400/65 font-mono break-all leading-relaxed">
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
      className="flex flex-col items-center text-center py-16 px-6 bg-white/[0.015] border border-dashed border-white/[0.09] rounded-2xl gap-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"
      >
        <PackageOpen size={30} className="text-orange-500" />
      </motion.div>

      <motion.div {...fadeUp(0.25)} className="flex flex-col gap-2">
        <h3 className="text-xl font-bold text-white/65">No Project Data Yet</h3>
        <p className="text-[13px] text-white/28 max-w-[360px] leading-relaxed">
          This workspace is freshly initialized. Add a description and configure
          your project to get started.
        </p>
      </motion.div>

      <motion.button
        {...fadeUp(0.35)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onConfigure}
        className="flex items-center gap-2 mt-1 px-6 py-3 rounded-[9px] bg-gradient-to-br from-orange-500 to-orange-600 text-[#0f0800] text-[13px] font-bold tracking-[0.08em] border-none cursor-pointer"
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
      {/* Topbar */}
      <motion.header
        {...fadeIn(0)}
        className="flex justify-between items-center px-7 py-3.5 border-b border-white/[0.05] gap-4 flex-wrap pl-14 md:pl-7"
      >
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-white/28">Workspace</span>
          <span className="text-white/15 mx-0.5">/</span>
          <span className="text-white/65 font-semibold">{project.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5">
            <Search size={12} className="text-white/22 shrink-0" />
            <input
              placeholder="Search parameters..."
              className="bg-transparent border-none outline-none text-[12.5px] text-white/55 w-36 placeholder:text-white/20"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            />
          </div>
          {[Bell, Settings].map((Icon, i) => (
            <button
              key={i}
              className="bg-white/[0.04] border border-white/[0.07] rounded-[7px] p-[7px] text-white/38 flex cursor-pointer transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/20"
            >
              <Icon size={14} />
            </button>
          ))}
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-[10px] font-bold text-[#0f0800] tracking-[0.05em] cursor-pointer shrink-0">
            FO
          </div>
        </div>
      </motion.header>

      {/* Sub-nav */}
      <motion.div
        {...fadeIn(0.05)}
        className="flex items-center justify-between px-7 py-2 border-b border-white/[0.04] flex-wrap gap-2 pl-14 md:pl-7"
      >
        <div className="flex gap-1">
          {[Boxes, LayoutDashboard, AlertCircle, Clock].map((Icon, i) => (
            <button
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-white/30 flex cursor-pointer transition-all duration-200 hover:text-orange-500 hover:bg-orange-500/[0.07]"
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-orange-500/[0.09] border border-orange-500/22 rounded-full px-3 py-1 font-mono text-[10px] text-orange-500 tracking-[0.08em]">
          <Zap size={10} />
          <span>ML Risk Score: 85%</span>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 px-7 py-8">
        {/* Page heading */}
        <motion.div
          {...fadeUp(0.08)}
          className="flex justify-between items-start gap-5 flex-wrap"
        >
          <div className="flex-1 min-w-[240px]">
            <p
              className="text-[10px] tracking-[0.2em] font-mono mb-2 uppercase"
              style={{ color: statusColor }}
            >
              PROJECT STATUS: {project.status}
            </p>
            <h1
              className="font-bold text-orange-500 leading-[1.02] mb-3"
              style={{ fontSize: "clamp(30px, 4vw, 50px)" }}
            >
              Project Overview
            </h1>
            {project.description ? (
              <p className="text-[13.5px] leading-[1.75] text-white/42 max-w-[520px]">
                {project.description}
              </p>
            ) : (
              <p className="text-[13px] text-white/18 italic">
                No description added yet.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 items-end">
            {project.description && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] bg-gradient-to-br from-orange-500 to-orange-600 text-[#0f0800] text-[13px] font-bold tracking-[0.1em] border-none cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit Project</span>
              </motion.button>
            )}
            <button
              onClick={() => setIsEmpty(!isEmpty)}
              className="text-[10px] font-mono text-white/22 tracking-[0.06em] bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5 cursor-pointer hover:text-white/45 transition-colors"
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
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <EmptyState onConfigure={() => setIsEmpty(false)} />

              <motion.div {...fadeUp(0.4)} className="max-w-md">
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
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={Users}
                  label="Team Members"
                  value={String(project.teamMembers.length)}
                  sub="Active collaborators"
                  color="#f97316"
                  delay={0.12}
                />
                <StatCard
                  icon={Boxes}
                  label="Workspace Nodes"
                  value="14"
                  sub="Geo-distributed"
                  color="#60a5fa"
                  delay={0.17}
                />
                <StatCard
                  icon={Zap}
                  label="System Latency"
                  value="12ms"
                  sub="Node ALPHA-7"
                  color="#a78bfa"
                  delay={0.22}
                />
                <StatCard
                  icon={AlertCircle}
                  label="Open Tasks"
                  value="7"
                  sub="Across all modules"
                  color="#f59e0b"
                  delay={0.27}
                />
              </div>

              {/* Bottom cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Team Activity */}
                <motion.div
                  {...fadeUp(0.3)}
                  className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.11] transition-colors duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-orange-500" />
                      <span className="text-[10px] tracking-[0.15em] text-white/38 font-mono">
                        TEAM ACTIVITY
                      </span>
                    </div>
                    <button className="text-[10px] text-orange-500 font-mono tracking-[0.06em] bg-transparent border-none cursor-pointer hover:underline">
                      View Log
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {project.teamMembers.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.07 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            background: `${m.avatarColor}1e`,
                            border: `1px solid ${m.avatarColor}38`,
                            color: m.avatarColor,
                          }}
                        >
                          {m.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] truncate leading-snug">
                            <span className="font-bold text-white/78">
                              {m.name}
                            </span>
                            <span className="text-white/38">
                              {" "}
                              {m.lastAction}
                            </span>
                          </p>
                          <p className="text-[9px] text-white/22 font-mono tracking-[0.06em] mt-0.5">
                            {m.timeAgo}
                          </p>
                        </div>
                        {m.online && (
                          <div className="w-[7px] h-[7px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.55)] shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Invite + Continue Setup */}
                <motion.div
                  {...fadeUp(0.35)}
                  className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.11] transition-colors duration-300"
                >
                  <InvitePanel
                    link={inviteLink}
                    onRegenerate={handleRegenerate}
                  />

                  <div className="flex flex-col gap-0.5 border-t border-white/[0.06] pt-4">
                    <p className="text-[9px] text-white/22 tracking-[0.16em] font-mono mb-2">
                      CONTINUE SETUP
                    </p>
                    {NAV_ITEMS.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.06 }}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-transparent border-none cursor-pointer text-[13px] font-semibold text-white/35 w-full text-left transition-all duration-200 hover:text-white/68 hover:bg-white/[0.04] group"
                        >
                          <Icon
                            size={13}
                            className="text-orange-500/45 group-hover:text-orange-500 transition-colors"
                          />
                          <span>{item.label}</span>
                          <ArrowRight
                            size={11}
                            className="ml-auto text-white/18 group-hover:text-orange-500 transition-colors duration-200"
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
        className="px-7 py-3 border-t border-white/[0.04] flex justify-between flex-wrap gap-2 text-[9px] text-white/16 font-mono tracking-[0.06em]"
      >
        <span>FORGE NEURAL CORE — REAL-TIME PREDICTIVE ANALYSIS ENABLED</span>
        <span>MD5_HASH: F8A3B92...C2D</span>
      </motion.footer>
    </div>
  );
}