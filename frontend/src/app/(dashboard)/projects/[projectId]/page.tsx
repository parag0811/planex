"use client";

import { AppDispatch } from "@/src/store/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  TriangleAlert,
  X,
  UserPlus,
  Check,
  ChevronDown,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  generateInviteLink,
  fetchProjectById,
  hideInviteLink,
  removeMember,
  showInviteLink,
  updateMemberRole,
  updateProject,
} from "@/src/store/slices/projectSlice";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { useState } from "react";

// ─── Color tokens ────────────────────────────────────────────────
// Main bg:        #0a0a0a
// Container bg:   #0f1010
// Brand accent:   #fb3c00
// Warm text:      #e4bab0
// Border:         #523721
// White text:     #ffffff (headings / values)
// Muted text:     #8a7a74

const stats = [
  { label: "Cluster Uptime", value: "99.982%" },
  { label: "Avg Latency", value: "14.2ms" },
  { label: "Node Count", value: "2,048" },
];

const riskItems = [
  "Schema circular dependency detected in auth_module_v3. Potential infinite traversal.",
  "Potential latency bottleneck in Node_04 during peak serialization.",
  "Insufficient GPU memory overhead for Epoch_12 validation run.",
];

const archProgress = [
  { label: "IDEA", value: 100 },
  { label: "DATABASE", value: 75 },
  { label: "API", value: 42 },
  { label: "DOCUMENTATION", value: 20 },
];

const neuralActivity = [
  {
    time: "14:22 PM",
    title: "API REGENERATED",
    desc: "Endpoint `/auth/v2` updated by System",
  },
  {
    time: "11:05 AM",
    title: "SOREN JOINED",
    desc: "Access granted to Core Database schema",
  },
  {
    time: "09:40 AM",
    title: "IDEA LOCK",
    desc: "Conceptual stage finalized by Juliana",
  },
];

// ─── Invite Modal ─────────────────────────────────────────────────
interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  members: any[];
  inviteLink: string | null;
  onRemove: (id: string) => void;
  onRoleChange: (id: string, role: "EDITOR" | "VIEWER") => void;
  onCopyLink: () => void;
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
  onCopyLink,
  removeLoading,
  updateLoading,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
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
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22 }}
          style={{
            background: "#0f1010",
            border: "1px solid #523721",
            fontFamily: "'Rajdhani', sans-serif",
            width: "100%",
            maxWidth: 520,
            borderRadius: 4,
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              borderBottom: "1px solid #523721",
              padding: "20px 24px 16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: "#fb3c00",
                  fontWeight: 700,
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                COLLABORATION / ADD
              </p>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                INVITE TEAMMATES
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#8a7a74",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Invite Form */}
          <div style={{ padding: "20px 24px" }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.22em",
                color: "#8a7a74",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              RECIPIENT EMAIL & PERMISSIONS
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arch.colleague@firm.com"
                style={{
                  flex: 1,
                  background: "#0a0a0a",
                  border: "1px solid #523721",
                  borderRadius: 2,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#e4bab0",
                  outline: "none",
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #523721",
                  borderRadius: 2,
                  padding: "10px 12px",
                  fontSize: 11,
                  color: "#e4bab0",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid #fb3c00",
                  borderRadius: 2,
                  padding: "10px 20px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fb3c00",
                  letterSpacing: "0.12em",
                  cursor: "pointer",
                  fontFamily: "'Rajdhani', sans-serif",
                  textTransform: "uppercase",
                }}
              >
                SEND
              </button>
            </div>

            {/* Members List */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: "#ffffff",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                TEAM MEMBERS ({members.length})
              </p>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  color: "#fb3c00",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                PERMISSIONS ACTIVE
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {members.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#0a0a0a",
                    border: "1px solid #523721",
                    borderRadius: 2,
                    fontSize: 12,
                    color: "#8a7a74",
                  }}
                >
                  No members yet.
                </div>
              ) : (
                members.map((member) => {
                  const name =
                    member.user?.name ?? member.user?.email ?? member.user_id;
                  const email = member.user?.email ?? "";
                  const initials = name
                    .split(" ")
                    .map((p: string) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const isOwner = member.role === "OWNER";

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: isOwner ? "rgba(251,60,0,0.06)" : "#0a0a0a",
                        border: `1px solid ${isOwner ? "#523721" : "rgba(82,55,33,0.5)"}`,
                        borderRadius: 2,
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            background: isOwner
                              ? "#fb3c00"
                              : "rgba(228,186,176,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#ffffff",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {initials || "?"}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#ffffff",
                            }}
                          >
                            {name}
                          </p>
                          <p style={{ fontSize: 10, color: "#8a7a74" }}>
                            {email}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {isOwner ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: "0.12em",
                              color: "#fb3c00",
                              textTransform: "uppercase",
                            }}
                          >
                            OWNER
                          </span>
                        ) : (
                          <>
                            <select
                              value={member.role ?? "VIEWER"}
                              onChange={(e) =>
                                onRoleChange(
                                  member.id,
                                  e.target.value as "EDITOR" | "VIEWER",
                                )
                              }
                              disabled={updateLoading}
                              style={{
                                background: "transparent",
                                border: "none",
                                fontSize: 10,
                                fontWeight: 800,
                                color: "#e4bab0",
                                letterSpacing: "0.1em",
                                outline: "none",
                                cursor: "pointer",
                                fontFamily: "'Rajdhani', sans-serif",
                                textTransform: "uppercase",
                              }}
                            >
                              <option value="EDITOR">EDITOR</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                            <button
                              onClick={() => onRemove(member.user_id)}
                              disabled={removeLoading}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#8a7a74",
                                padding: 2,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <X size={14} />
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid #523721",
              }}
            >
              <button
                onClick={handleCopy}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fb3c00",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: "'Rajdhani', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "COPIED" : "COPY INVITE LINK"}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#8a7a74",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                DONE
              </button>
            </div>
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
  const { update, remove, inviteLink, inviteLinkVisible, inviteLinkState } =
    useSelector((state: RootState) => state.project);
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [projectNameMessage, setProjectNameMessage] = useState<string | null>(
    null,
  );
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    if (currentProject?.name) {
      setProjectNameDraft(currentProject.name);
    }
  }, [currentProject?.name]);

  const members = currentProject?.members ?? [];
  const projectName = currentProject?.name ?? "Project";
  const projectDescription = String(
    currentProject?.description ?? "Project details are loading.",
  );

  const handleUpdateProjectName = async (event: React.FormEvent) => {
    event.preventDefault();
    setProjectNameMessage(null);
    if (!projectId) return;
    const trimmedName = projectNameDraft.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setProjectNameMessage("Name must be at least 3 characters.");
      return;
    }
    if (trimmedName === currentProject?.name) {
      setProjectNameMessage("No changes to save yet.");
      return;
    }
    try {
      await dispatch(updateProject({ projectId, name: trimmedName })).unwrap();
      setProjectNameMessage("Project name updated.");
    } catch (err: any) {
      setProjectNameMessage(
        typeof err === "string" ? err : "Unable to update project.",
      );
    }
  };

  const handleRoleChange = (memberId: string, role: "EDITOR" | "VIEWER") => {
    if (!projectId) return;
    dispatch(updateMemberRole({ projectId, memberId, role }));
  };

  const handleRemoveMember = (memberId: string) => {
    if (!projectId) return;
    dispatch(removeMember({ projectId, memberId }));
  };

  const handleGenerateInviteLink = () => {
    if (!projectId) return;
    dispatch(generateInviteLink(projectId));
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      {/* ─── Invite Modal ─── */}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        members={members}
        inviteLink={inviteLink}
        onRemove={handleRemoveMember}
        onRoleChange={handleRoleChange}
        onCopyLink={handleCopyInviteLink}
        removeLoading={remove.loading}
        updateLoading={update.loading}
      />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          background: "#0a0a0a",
          padding: "24px 28px",
          fontFamily: "'Rajdhani', sans-serif",
          color: "#e4bab0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* ─── Breadcrumb ─── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: "#523721" }}>PLANEX</span>
            <span style={{ color: "#2d1f15" }}>&gt;</span>
            <span style={{ color: "#8a7a74" }}>
              {projectName.toUpperCase()}
            </span>
            <span style={{ color: "#2d1f15" }}>&gt;</span>
            <span style={{ color: "#fb3c00" }}>DASHBOARD</span>
          </div>

          {/* ─── Hero Card ─── */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "#0f1010",
              border: "1px solid #523721",
              borderRadius: 4,
              padding: "20px 24px",
              marginBottom: 20,
            }}
          >
            {/* Top row: title + status + edit */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                {/* CID / meta */}
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "#8a7a74",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  CREATED: 2024.03.12&nbsp;&nbsp;&nbsp;UPDATED:
                  2024.05.28&nbsp;&nbsp;&nbsp;CID: 6CF-8821-X
                </div>
                <h1
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#fb3c00",
                    letterSpacing: "0.03em",
                    lineHeight: 1.1,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {projectName}
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "#8a7a74",
                    maxWidth: 520,
                  }}
                >
                  {projectDescription}
                </p>
              </div>

              {/* Right column: status badge + edit form */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    border: "1px solid #fb3c00",
                    padding: "6px 12px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "#fb3c00",
                    textTransform: "uppercase",
                    borderRadius: 2,
                    textAlign: "center",
                  }}
                >
                  §TATU§:
                  <br />
                  ACTIVE
                </div>

                <form
                  onSubmit={handleUpdateProjectName}
                  style={{
                    width: 220,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <label
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      color: "#8a7a74",
                      textTransform: "uppercase",
                    }}
                  >
                    Edit project name
                  </label>
                  <input
                    type="text"
                    value={projectNameDraft}
                    onChange={(e) => setProjectNameDraft(e.target.value)}
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid #523721",
                      borderRadius: 2,
                      padding: "7px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#ffffff",
                      outline: "none",
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                    placeholder="Project name"
                  />
                  <button
                    type="submit"
                    disabled={update.loading}
                    style={{
                      background: "rgba(251,60,0,0.12)",
                      border: "1px solid rgba(251,60,0,0.4)",
                      borderRadius: 2,
                      padding: "7px 12px",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#fb3c00",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: update.loading ? "not-allowed" : "pointer",
                      opacity: update.loading ? 0.6 : 1,
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  >
                    {update.loading ? "UPDATING..." : "UPDATE"}
                  </button>
                  {projectNameMessage && (
                    <p style={{ fontSize: 10, color: "#e4bab0" }}>
                      {projectNameMessage}
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* Risk Assessment bar */}
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #523721",
                borderRadius: 3,
                padding: "14px 16px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "#8a7a74",
                    textTransform: "uppercase",
                  }}
                >
                  RISK ASSESSMENT / CORETECHNICAL &nbsp;&nbsp; 12%
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#fb3c00",
                    lineHeight: 1,
                  }}
                >
                  08
                </span>
                <span
                  style={{ fontSize: 13, color: "#8a7a74", marginBottom: 6 }}
                >
                  /LOW
                </span>
                <div style={{ marginLeft: 8 }}>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      color: "#8a7a74",
                      marginBottom: 4,
                    }}
                  >
                    ARCHITECTURE &nbsp; 05%
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      color: "#8a7a74",
                    }}
                  >
                    SCALABILITY &nbsp; 18%
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#8a7a74", lineHeight: 1.6 }}>
                The current architectural integrity is high. AI simulation
                suggests minor bottlenecks in the API Response Normalization
                layer under extreme concurrent loads.
              </p>
            </div>

            {/* Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.04 }}
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #523721",
                    borderRadius: 3,
                    padding: "14px 16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      color: "#8a7a74",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{ fontSize: 28, fontWeight: 700, color: "#ffffff" }}
                  >
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── Architecture Progress ─── */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            style={{
              background: "#0f1010",
              border: "1px solid #523721",
              borderRadius: 4,
              padding: "20px 24px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.22em",
                color: "#8a7a74",
                textTransform: "uppercase",
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              ARCHITECTURE PROGRESS
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
              }}
            >
              {archProgress.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.05 }}
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #523721",
                    borderRadius: 3,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        color: "#8a7a74",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.label}
                    </p>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 1,
                        background:
                          item.value === 100
                            ? "#fb3c00"
                            : "rgba(251,60,0,0.35)",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: "#ffffff",
                      marginBottom: 10,
                    }}
                  >
                    {item.value}%
                  </p>
                  <div
                    style={{
                      height: 2,
                      background: "#1a1a1a",
                      borderRadius: 1,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.value}%`,
                        background: "#fb3c00",
                        borderRadius: 1,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── Lower Grid: Team + Activity | Access + Risk ─── */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Left: Team + Neural Activity */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Project Core Team */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.28 }}
                style={{
                  background: "#0f1010",
                  border: "1px solid #523721",
                  borderRadius: 4,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    color: "#8a7a74",
                    textTransform: "uppercase",
                    marginBottom: 14,
                    fontWeight: 700,
                  }}
                >
                  PROJECT CORE TEAM
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {members.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#8a7a74",
                        padding: "10px 0",
                      }}
                    >
                      No members yet. Invite your team below.
                    </div>
                  ) : (
                    members.slice(0, 4).map((member) => {
                      const name =
                        member.user?.name ??
                        member.user?.email ??
                        member.user_id;
                      const initials = name
                        .split(" ")
                        .map((p: string) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      const isOnline = Math.random() > 0.4;
                      return (
                        <div
                          key={member.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 0",
                            borderBottom: "1px solid rgba(82,55,33,0.35)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                background: "rgba(228,186,176,0.1)",
                                border: "1px solid #523721",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#e4bab0",
                              }}
                            >
                              {initials || "?"}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#ffffff",
                                }}
                              >
                                {name}
                              </p>
                              <p
                                style={{
                                  fontSize: 9,
                                  letterSpacing: "0.1em",
                                  color: "#8a7a74",
                                  textTransform: "uppercase",
                                }}
                              >
                                {member.role ?? "VIEWER"}
                              </p>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              color: isOnline ? "#4ade80" : "#8a7a74",
                              textTransform: "uppercase",
                            }}
                          >
                            {isOnline ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  style={{
                    marginTop: 14,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fb3c00",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontFamily: "'Rajdhani', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 0,
                  }}
                >
                  <UserPlus size={13} />
                  INVITE TEAMMATE
                </button>
              </motion.div>

              {/* Neural Activity */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.28 }}
                style={{
                  background: "#0f1010",
                  border: "1px solid #523721",
                  borderRadius: 4,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    color: "#8a7a74",
                    textTransform: "uppercase",
                    marginBottom: 14,
                    fontWeight: 700,
                  }}
                >
                  NEURAL ACTIVITY
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {neuralActivity.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 1,
                          background: i === 0 ? "#fb3c00" : "#523721",
                          marginTop: 4,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: 9,
                            color: "#8a7a74",
                            marginBottom: 2,
                          }}
                        >
                          {item.time}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#ffffff",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            marginBottom: 2,
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#8a7a74",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: Access + Risk */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Recommended Actions */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.28 }}
                style={{
                  background: "#0f1010",
                  border: "1px solid #523721",
                  borderRadius: 4,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    color: "#8a7a74",
                    textTransform: "uppercase",
                    marginBottom: 14,
                    fontWeight: 700,
                  }}
                >
                  RECOMMENDED ACTIONS
                </p>
                {[
                  { action: "REVIEW §CHEMA", status: "PENDING APPROVAL" },
                  {
                    action: "AUTHORIZE API",
                    status: "SECURITY AUDIT REQUIRED",
                  },
                  { action: "OPTIMIZE DB INDICE§", status: "LOW PRIORITY" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom:
                        i < 2 ? "1px solid rgba(82,55,33,0.35)" : "none",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#ffffff",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {item.action}
                      </p>
                      <p
                        style={{
                          fontSize: 9,
                          color: "#8a7a74",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginTop: 2,
                        }}
                      >
                        {item.status}
                      </p>
                    </div>
                    <span
                      style={{
                        color: "#fb3c00",
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      →
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Project Access */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.28 }}
                style={{
                  background: "#0f1010",
                  border: "1px solid #523721",
                  borderRadius: 4,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    color: "#8a7a74",
                    textTransform: "uppercase",
                    marginBottom: 12,
                    fontWeight: 700,
                  }}
                >
                  PROJECT ACCESS
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.16em",
                      color: "#8a7a74",
                      textTransform: "uppercase",
                      flex: 1,
                    }}
                  >
                    PROJECT INVITE URL
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleGenerateInviteLink}
                      disabled={inviteLinkState.loading}
                      style={{
                        background: "rgba(251,60,0,0.1)",
                        border: "1px solid rgba(251,60,0,0.35)",
                        borderRadius: 2,
                        padding: "5px 12px",
                        fontSize: 9,
                        fontWeight: 800,
                        color: "#fb3c00",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        cursor: inviteLinkState.loading
                          ? "not-allowed"
                          : "pointer",
                        opacity: inviteLinkState.loading ? 0.6 : 1,
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      {inviteLinkState.loading
                        ? "GENERATING..."
                        : "GENERATE LINK"}
                    </button>
                    {inviteLink && (
                      <button
                        onClick={() =>
                          dispatch(
                            inviteLinkVisible
                              ? hideInviteLink()
                              : showInviteLink(),
                          )
                        }
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 2,
                          padding: "5px 12px",
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#e4bab0",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          fontFamily: "'Rajdhani', sans-serif",
                        }}
                      >
                        {inviteLinkVisible ? "HIDE" : "SHOW"}
                      </button>
                    )}
                  </div>
                </div>

                {inviteLinkState.error && (
                  <p
                    style={{ fontSize: 11, color: "#f87171", marginBottom: 10 }}
                  >
                    {inviteLinkState.error}
                  </p>
                )}

                {inviteLinkVisible && inviteLink && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#060911",
                      border: "1px solid rgba(82,55,33,0.5)",
                      borderRadius: 2,
                      padding: "8px 10px",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 11,
                        color: "#e4bab0",
                      }}
                    >
                      {inviteLink}
                    </span>
                    <button
                      onClick={handleCopyInviteLink}
                      style={{
                        background: "#ffffff",
                        border: "none",
                        borderRadius: 2,
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#0a0a0a",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "'Rajdhani', sans-serif",
                      }}
                    >
                      {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                      {copiedLink ? "COPIED" : "COPY"}
                    </button>
                  </div>
                )}

                {!inviteLink && !inviteLinkState.loading && (
                  <p style={{ fontSize: 11, color: "#8a7a74" }}>
                    Generate a link to share access with other members.
                  </p>
                )}
              </motion.div>

              {/* ML Risk Diagnostics */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.28 }}
                style={{
                  background: "#130d08",
                  border: "1px solid rgba(251,60,0,0.35)",
                  borderRadius: 4,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: "#8a7a74",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    ML RISK DIAGNOSTICS
                  </p>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#fb3c00",
                      border: "1px solid rgba(251,60,0,0.35)",
                      padding: "3px 8px",
                      borderRadius: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    MEDIUM_THREAT
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <TriangleAlert size={13} color="#fb3c00" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#e4bab0",
                      textTransform: "uppercase",
                    }}
                  >
                    RISK LEVEL
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {riskItems.map((item) => (
                    <li
                      key={item}
                      style={{
                        display: "flex",
                        gap: 8,
                        fontSize: 11,
                        color: "rgba(228,186,176,0.9)",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          color: "#fb3c00",
                          marginTop: 2,
                          flexShrink: 0,
                        }}
                      >
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
