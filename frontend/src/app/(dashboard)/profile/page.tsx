"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store/store";
import { updateUserProfile } from "@/src/store/slices/authSlice";
import { motion } from "framer-motion";
import { Upload, Save, AlertCircle, CheckCircle } from "lucide-react";

// Design tokens
const BG = "#141414";
const ACCENT = "#ff3d00";
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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: EASE } as any,
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, profileLoading: loading, error } = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return (
      user?.avatar ||
      user?.avatarUrl ||
      user?.image ||
      user?.photoURL ||
      user?.picture ||
      user?.profilePic ||
      ""
    );
  }, [avatarFile, user]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setStatusMessage(null);
    setStatusType(null);

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please choose an image file.");
      setStatusType("error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage("Image must be under 2MB.");
      setStatusType("error");
      return;
    }

    setAvatarFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusType(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setStatusMessage("Name must be at least 2 characters.");
      setStatusType("error");
      return;
    }

    const hasNameChange = trimmedName !== (user?.name || "");
    if (!hasNameChange && !avatarFile) {
      setStatusMessage("Nothing to update yet.");
      setStatusType("error");
      return;
    }

    const formData = new FormData();
    if (hasNameChange) {
      formData.append("name", trimmedName);
    }

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      setAvatarFile(null);
      setStatusMessage("Profile updated successfully.");
      setStatusType("success");
    } catch (updateError: any) {
      setStatusMessage(
        typeof updateError === "string"
          ? updateError
          : "Unable to update profile.",
      );
      setStatusType("error");
    }
  };

  const initials = useMemo(() => {
    const sourceName = user?.name || user?.email || "IN";
    const parts = String(sourceName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return String(sourceName).slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ ...INTER, backgroundColor: BG }}
    >
      <div className="flex-1">
        <motion.div
          className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Breadcrumb */}
          <motion.div variants={fadeUp(0)} className="mb-3">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ ...MONO, color: ACCENT }}
            >
              Workspace // Profile
            </p>
          </motion.div>

          {/* Header */}
          <motion.div
            variants={fadeUp(1)}
            className="mb-8"
          >
            <h1
              className="text-[3.4rem] sm:text-[4.2rem] md:text-[5rem] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
              style={INTER_TIGHT}
            >
              Your Profile
            </h1>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp(2)} className="mb-10 flex items-center gap-3">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em] shrink-0"
              style={{ ...MONO, color: MUTED }}
            >
              Account Settings
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          </motion.div>

          {/* Status Message */}
          <motion.div variants={fadeUp(3)}>
            {(statusMessage || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center gap-3 border px-4 py-3"
                style={{
                  borderColor:
                    statusType === "success"
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(239, 68, 68, 0.3)",
                  backgroundColor:
                    statusType === "success"
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(239, 68, 68, 0.08)",
                }}
              >
                {statusType === "success" ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                )}
                <p
                  className="text-sm font-medium"
                  style={{
                    ...INTER,
                    color: statusType === "success" ? "#34d399" : "#f87171",
                  }}
                >
                  {statusMessage || error}
                </p>
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
            {/* Avatar Section */}
            <motion.div variants={fadeUp(4)}>
              <div
                className="border p-6 flex flex-col items-center gap-6"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <div
                  className="relative flex h-32 w-32 items-center justify-center border overflow-hidden rounded-full"
                  style={{ borderColor: BORDER, backgroundColor: BG }}
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt={user?.name ? `${user.name} profile` : "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-4xl font-bold tracking-widest text-[#ff3d00]"
                      style={MONO}
                    >
                      {initials}
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-white mb-1" style={INTER_TIGHT}>
                    {user?.name || "Your Account"}
                  </p>
                  <p className="text-xs" style={{ ...MONO, color: MUTED }}>
                    {user?.email || "user@example.com"}
                  </p>
                </div>

                <label
                  className="flex cursor-pointer items-center justify-center gap-2 border w-full py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:opacity-80"
                  style={{
                    ...MONO,
                    borderColor: ACCENT,
                    color: ACCENT,
                    backgroundColor: `${ACCENT}12`,
                  }}
                >
                  <Upload size={13} />
                  Upload Avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </motion.div>

            {/* Edit Form */}
            <motion.div variants={fadeUp(5)}>
              <form
                onSubmit={handleSubmit}
                className="border p-8"
                style={{ borderColor: BORDER, backgroundColor: INNER_BG }}
              >
                <div className="grid gap-8">
                  <div>
                    <label
                      className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full border px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
                      style={{ borderColor: BORDER, backgroundColor: BG, ...INTER }}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ ...MONO, color: MUTED }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="w-full border px-4 py-3 text-base outline-none opacity-60 cursor-not-allowed"
                      style={{ borderColor: BORDER, backgroundColor: BG, color: MUTED, ...INTER }}
                    />
                    <p className="mt-2 text-xs" style={{ ...INTER, color: MUTED }}>
                      Email addresses cannot be changed directly.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-8" style={{ borderColor: BORDER }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex cursor-pointer items-center gap-2 border px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition disabled:opacity-50"
                    style={{
                      ...MONO,
                      borderColor: ACCENT,
                      color: ACCENT,
                      backgroundColor: `${ACCENT}12`,
                    }}
                  >
                    <Save size={14} />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <span className="text-[10px] uppercase tracking-[0.1em]" style={{ ...MONO, color: MUTED }}>
                    Changes apply across all workspaces
                  </span>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-auto" style={{ borderColor: BORDER, backgroundColor: BG }}>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start justify-between gap-4 px-5 py-6 sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-white"
              style={MONO}
            >
              Planex
            </p>
            <p
              className="mt-1 text-[10px] uppercase tracking-[0.1em]"
              style={{ ...MONO, color: MUTED }}
            >
              © 2026 All rights reserved
            </p>
          </div>
          <div className="flex gap-5">
            {["Documentation", "Privacy", "Terms"].map((item) => (
              <button
                key={item}
                type="button"
                className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
                style={{ ...MONO, color: MUTED }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
