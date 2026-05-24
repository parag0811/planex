"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store/store";
import { updateUserProfile } from "@/src/store/slices/authSlice";

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
      if (avatarFile) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setStatusMessage(null);

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage("Image must be under 2MB.");
      return;
    }

    setAvatarFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setStatusMessage("Name must be at least 2 characters.");
      return;
    }

    const hasNameChange = trimmedName !== (user?.name || "");
    if (!hasNameChange && !avatarFile) {
      setStatusMessage("Nothing to update yet.");
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
    } catch (updateError: any) {
      setStatusMessage(
        typeof updateError === "string"
          ? updateError
          : "Unable to update profile.",
      );
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
    <main className="min-h-screen bg-[#11151f] px-6 pt-24 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-[#101722] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#f97316]/70">
            Profile
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Your profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a89880]">
            Keep your identity fresh for your workspace. Update your display name
            and avatar anytime.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0b111b] p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-[#1a2130] text-2xl font-bold text-[#f97316]">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt={user?.name ? `${user.name} profile` : "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">
                    {user?.name || "Your account"}
                  </p>
                  <p className="text-xs text-[#7f889d]">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <label className="w-full cursor-pointer rounded-full border border-[#f97316]/40 bg-[#11151f] px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#f97316] transition-colors hover:border-[#f97316] hover:bg-[#151c29]">
                  Upload avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-[#0f1624] p-6"
            >
              <div className="grid gap-6">
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#8b93a6]">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#11151f] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#f97316]/60"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#8b93a6]">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-white/5 bg-[#0c111b] px-4 py-3 text-sm text-[#7f889d]"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#f97316] px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-black transition-opacity disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
                <span className="text-xs text-[#8b93a6]">
                  Changes sync across sessions.
                </span>
              </div>

              {(statusMessage || error) && (
                <p className="mt-4 text-sm text-[#f5b38c]">
                  {statusMessage || error}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
