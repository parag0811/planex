"use client";

import { AppDispatch } from "@/src/store/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  X,
  UserPlus,
  Check,
  Users,
  Link2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  generateInviteLink,
  hideInviteLink,
  removeMember,
  showInviteLink,
  updateMemberRole,
  updateProject,
  fetchProjectActivities,
} from "@/src/store/slices/projectSlice";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";

// ─── Design tokens — identical to Idea page ──────────────────────────────────
const BG = "#141414";
const ACCENT = "#d84c28";
const BORDER = "#2b2321";
const MUTED = "#a6786d";
const INNER_BG = "#101010";

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};
const INTER_TIGHT: React.CSSProperties = {
  fontFamily: '"Inter Tight", "Inter", system-ui, sans-serif',
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (i: number) => ({
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: EASE },
  },
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (Math.abs(diffInSeconds) < 60) return "just now";
  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');
  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');
  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) return rtf.format(diffInDays, 'day');
  const diffInMonths = Math.round(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) return rtf.format(diffInMonths, 'month');
  return date.toLocaleDateString();
}

// ─── Invite Modal ─────────────────────────────────────────────────
interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  members: any[];
  inviteLink: string | null;
  onRemove: (userId: string) => void;
  onRoleChange: (memberId: string, role: "EDITOR" | "VIEWER") => void;
  onGenerateLink: () => void;
  onCopyLink: () => void;
  generateLoading: boolean;
  removeLoading: boolean;
  updateLoading: boolean;
}

function InviteModal({
  open,
  onClose,
  members,
  inviteLink,
  onRemove,
  onRoleChange,
  onGenerateLink,
  onCopyLink,
  generateLoading,
  removeLoading,
  updateLoading,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (!inviteLink) return;
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="w-full max-w-lg border p-6"
          style={{ borderColor: BORDER, backgroundColor: BG, ...INTER }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p
                className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ ...MONO, color: ACCENT }}
              >
                Collaboration // Add
              </p>
              <h2
                className="text-2xl font-black uppercase leading-none text-white"
                style={INTER_TIGHT}
              >
                Invite Teammates
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 transition hover:text-white"
              style={{ color: MUTED }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Invite link generator */}
          <div className="mb-6">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ ...MONO, color: MUTED }}
            >
              Invite Link
            </p>
            <div className="flex gap-2">
              <button
                onClick={onGenerateLink}
                disabled={generateLoading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 border px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-50"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <Link2 size={12} />
                {generateLoading
                  ? "Generating..."
                  : inviteLink
                    ? "Regenerate Link"
                    : "Generate Link"}
              </button>
            </div>

            {inviteLink && (
              <div
                className="mt-2 flex items-center gap-2 border px-3 py-2.5"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <span
                  className="flex-1 truncate text-[12px]"
                  style={{ color: MUTED }}
                >
                  {inviteLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] transition"
                  style={{
                    ...MONO,
                    borderColor: BORDER,
                    color: "#fff",
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>

          {/* Members List */}
          <div className="mb-2 flex items-center gap-3">
            <span
              className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ ...MONO, color: MUTED }}
            >
              Team Members ({members.length})
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          </div>

          <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {members.length === 0 ? (
              <div
                className="border p-4 text-sm"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG, color: MUTED, ...INTER }}
              >
                No members yet.
              </div>
            ) : (
              members.map((member) => {
                const name =
                  member.user?.name ?? member.user?.email ?? member.user_id;
                const email = member.user?.email ?? "";
                const initials = String(name)
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isOwner = member.role === "OWNER";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 border px-3 py-2.5"
                    style={{
                      borderColor: BORDER,
                      backgroundColor: isOwner ? `${ACCENT}0c` : INNER_BG,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[11px] font-bold text-white"
                        style={{
                          backgroundColor: isOwner ? ACCENT : "rgba(255,255,255,0.08)",
                        }}
                      >
                        {initials || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white" style={INTER}>
                          {name}
                        </p>
                        {email && (
                          <p className="truncate text-[10px]" style={{ color: MUTED }}>
                            {email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      {isOwner ? (
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.12em]"
                          style={{ ...MONO, color: ACCENT }}
                        >
                          Owner
                        </span>
                      ) : (
                        <>
                          <select
                            value={member.role ?? "VIEWER"}
                            onChange={(e) =>
                              onRoleChange(member.id, e.target.value as "EDITOR" | "VIEWER")
                            }
                            disabled={updateLoading}
                            className="cursor-pointer bg-transparent text-[9px] font-bold uppercase tracking-[0.1em] text-white outline-none"
                            style={MONO}
                          >
                            <option style={{ backgroundColor: INNER_BG }} value="EDITOR">
                              Editor
                            </option>
                            <option style={{ backgroundColor: INNER_BG }} value="VIEWER">
                              Viewer
                            </option>
                          </select>
                          <button
                            onClick={() => onRemove(member.user_id)}
                            disabled={removeLoading}
                            className="cursor-pointer p-1 transition hover:text-red-400"
                            style={{ color: MUTED }}
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end border-t pt-4" style={{ borderColor: BORDER }}>
            <button
              onClick={onClose}
              className="cursor-pointer border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
              style={{ ...MONO, borderColor: BORDER, color: MUTED }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : Array.isArray(params?.projectId)
        ? params.projectId[0]
        : undefined;
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector(
    (state: RootState) => state.project.currentProject,
  );
  const { update, remove, inviteLink, inviteLinkVisible, inviteLinkState, activities } =
    useSelector((state: RootState) => state.project);

  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    if (currentProject?.name) {
      setProjectNameDraft(currentProject.name);
    }
  }, [currentProject?.name]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus(null);
        setStatusType(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectActivities(projectId));
      const interval = setInterval(() => {
        dispatch(fetchProjectActivities(projectId));
      }, 30000); // 30 seconds polling
      return () => clearInterval(interval);
    }
  }, [projectId, dispatch]);

  const members = currentProject?.members ?? [];
  const projectName = currentProject?.name ?? "Project";
  const projectDescription = String(
    currentProject?.description ?? "No description provided yet.",
  );

  const handleUpdateProjectName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    const trimmedName = projectNameDraft.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setStatus("Name must be at least 3 characters.");
      setStatusType("error");
      return;
    }
    if (trimmedName === currentProject?.name) {
      setStatus("No changes to save yet.");
      setStatusType("error");
      return;
    }
    try {
      await dispatch(updateProject({ projectId, name: trimmedName })).unwrap();
      setStatus("Project name updated.");
      setStatusType("success");
    } catch (err: any) {
      setStatus(typeof err === "string" ? err : "Unable to update project.");
      setStatusType("error");
    }
  };

  // updateMemberRole updates by ProjectMember.id
  const handleRoleChange = (memberId: string, role: "EDITOR" | "VIEWER") => {
    if (!projectId) return;
    dispatch(updateMemberRole({ projectId, memberId, role }));
  };

  // removeMember deletes by user_id (matches user_id_project_id compound key)
  const handleRemoveMember = (userId: string) => {
    if (!projectId) return;
    dispatch(removeMember({ projectId, memberId: userId }));
  };

  const handleGenerateInviteLink = () => {
    if (!projectId) return;
    dispatch(generateInviteLink(projectId));
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  return (
    <>
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        members={members}
        inviteLink={inviteLink}
        onRemove={handleRemoveMember}
        onRoleChange={handleRoleChange}
        onGenerateLink={handleGenerateInviteLink}
        onCopyLink={handleCopyInviteLink}
        generateLoading={inviteLinkState.loading}
        removeLoading={remove.loading}
        updateLoading={update.loading}
      />

      <div
        className="relative w-full flex-1 overflow-y-auto overflow-x-hidden"
        style={{ ...INTER, backgroundColor: BG }}
      >
        <div className="min-w-0 flex-1 overflow-y-auto">
          <motion.div
            className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:px-10"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {/* Status toast */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="mb-6 flex items-center gap-3 border px-4 py-3"
                  style={{
                    borderColor:
                      statusType === "success"
                        ? "rgba(34,197,94,0.3)"
                        : "rgba(245,158,11,0.3)",
                    backgroundColor:
                      statusType === "success"
                        ? "rgba(34,197,94,0.08)"
                        : "rgba(245,158,11,0.08)",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{
                      ...INTER,
                      color: statusType === "success" ? "#34d399" : "#fbbf24",
                    }}
                  >
                    {status}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Breadcrumb */}
            <motion.div variants={fadeUp(0)} className="mb-3">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ ...MONO, color: ACCENT }}
              >
                Section // 00 / Overview
              </p>
            </motion.div>

            {/* Giant headline */}
            <motion.div variants={fadeUp(1)} className="mb-6">
              <h1
                className="text-[3rem] sm:text-[3.8rem] md:text-[4.4rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
                style={INTER_TIGHT}
              >
                {projectName}
              </h1>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp(2)} className="mb-10 max-w-2xl">
              <p className="text-base leading-relaxed" style={{ ...INTER, color: MUTED }}>
                {projectDescription}
              </p>
            </motion.div>

            {/* Edit project name */}
            <motion.div variants={fadeUp(3)} className="mb-12">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ ...MONO, color: MUTED }}
                >
                  Project Settings
                </span>
                <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
              </div>

              <form
                onSubmit={handleUpdateProjectName}
                className="flex flex-col gap-3 border p-6 sm:flex-row sm:items-end"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <div className="flex-1">
                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ ...MONO, color: MUTED }}
                  >
                    Project Name
                  </p>
                  <input
                    type="text"
                    value={projectNameDraft}
                    onChange={(e) => setProjectNameDraft(e.target.value)}
                    placeholder="Project name"
                    className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/30"
                    style={INTER}
                  />
                </div>
                <button
                  type="submit"
                  disabled={update.loading}
                  className="shrink-0 cursor-pointer border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-50"
                  style={{
                    ...MONO,
                    borderColor: ACCENT,
                    color: ACCENT,
                    backgroundColor: `${ACCENT}12`,
                  }}
                >
                  {update.loading ? "Updating..." : "Update"}
                </button>
              </form>
            </motion.div>

            {/* Team */}
            <motion.div variants={fadeUp(4)} className="mb-12">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ ...MONO, color: MUTED }}
                >
                  Team ({members.length})
                </span>
                <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
              </div>

              {members.length === 0 ? (
                <div
                  className="border p-8 text-center"
                  style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                >
                  <p className="text-base" style={{ ...INTER, color: MUTED }}>
                    No members yet. Invite your team to start collaborating.
                  </p>
                </div>
              ) : (
                <div className="border" style={{ borderColor: BORDER }}>
                  {members.slice(0, 5).map((member, i) => {
                    const name =
                      member.user?.name ?? member.user?.email ?? member.user_id;
                    const initials = String(name)
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 border-t px-5 py-4 first:border-t-0"
                        style={{ borderColor: BORDER }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold text-white"
                          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                        >
                          {initials || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-white" style={INTER}>
                            {name}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em]"
                          style={{ ...MONO, color: MUTED }}
                        >
                          {member.role ?? "VIEWER"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setInviteModalOpen(true)}
                className="mt-4 flex cursor-pointer items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition"
                style={{
                  ...MONO,
                  borderColor: ACCENT,
                  color: ACCENT,
                  backgroundColor: `${ACCENT}12`,
                }}
              >
                <UserPlus size={13} />
                Manage Team
              </button>
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={fadeUp(5)} className="mb-12">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ ...MONO, color: MUTED }}
                >
                  Activity / Changes
                </span>
                <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
              </div>

              {(!activities || activities.length === 0) ? (
                <div
                  className="border p-8 text-center"
                  style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
                >
                  <p className="text-base" style={{ ...INTER, color: MUTED }}>
                    No activity recorded yet.
                  </p>
                </div>
              ) : (
                <div className="border" style={{ borderColor: BORDER }}>
                  {activities.map((activity, i) => {
                    const name = activity.user?.name ?? activity.user?.email ?? "Unknown User";
                    const initials = String(name)
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 border-t px-5 py-4 first:border-t-0"
                        style={{ borderColor: BORDER }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold text-white mt-0.5"
                          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                        >
                          {initials || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-white" style={INTER}>
                            {name}
                          </p>
                          <p className="text-sm mt-0.5" style={{ ...INTER, color: MUTED }}>
                            {activity.details || activity.action}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em]"
                          style={{ ...MONO, color: MUTED }}
                        >
                          {getRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

          </motion.div>
        </div>
      </div>
    </>
  );
}