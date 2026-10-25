"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
} from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Field,
  Input,
} from "@/src/components/ui";
import { cn } from "@/src/lib/cn";
import { updateUserProfile } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    user,
    profileLoading: loading,
    error,
  } = useSelector((state: RootState) => state.auth);

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? user?.name ?? "";
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return user?.avatarUrl || user?.avatar || user?.image || "";
  }, [avatarFile, user]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => {
      setStatusMessage(null);
      setStatusType(null);
    }, 3500);
    return () => clearTimeout(timer);
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
      setStatusMessage("Image must be under 2 MB.");
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
    if (hasNameChange) formData.append("name", trimmedName);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      setAvatarFile(null);
      setNameDraft(null);
      setStatusMessage("Profile updated successfully.");
      setStatusType("success");
    } catch (updateError) {
      setStatusMessage(
        typeof updateError === "string"
          ? updateError
          : "Unable to update profile.",
      );
      setStatusType("error");
    }
  };

  const displayMessage = statusMessage || error;

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 sm:px-8 sm:py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
        Workspace / Profile
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
        Profile
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Manage your account and avatar.
      </p>

      {displayMessage ? (
        <div
          role={statusType === "error" ? "alert" : "status"}
          className={cn(
            "mt-5 flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[12px]",
            statusType === "success"
              ? "border-success/25 bg-success-soft text-success"
              : "border-danger/25 bg-danger-soft text-danger",
          )}
        >
          {statusType === "success" ? (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
          )}
          <span>{displayMessage}</span>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar
              src={avatarPreview}
              name={user?.name || user?.email}
              className="h-24 w-24 text-2xl"
            />
            <p className="mt-4 text-[15px] font-semibold text-ink">
              {user?.name || "Your account"}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {user?.email || "—"}
            </p>

            <label className="mt-5 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface text-[13px] text-ink transition-colors hover:bg-surface-muted">
              <Upload size={15} />
              Upload avatar
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <p className="mt-2 text-[10px] text-ink-muted">
              PNG or JPG, up to 2 MB.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Full name" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setNameDraft(event.target.value)}
                  placeholder="Your name"
                />
              </Field>

              <Field
                label="Email address"
                htmlFor="profile-email"
                hint="Email addresses cannot be changed directly."
              >
                <Input
                  id="profile-email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                />
              </Field>

              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
                <Button
                  type="submit"
                  loading={loading}
                  leftIcon={<Save size={15} />}
                >
                  Save changes
                </Button>
                <span className="text-[11px] text-ink-muted">
                  Changes apply across all workspaces.
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-[14px] font-semibold text-ink">Account</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Member since
              </p>
              <p className="mt-1 text-[13px] text-ink">
                {formatDate(user?.created_at)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                User ID
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-ink-soft">
                {user?.id || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
