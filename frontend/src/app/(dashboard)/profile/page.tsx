"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Save,
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
import {
  fetchUser,
  generateRecoveryCode,
  updateUserProfile,
} from "@/src/store/slices/authSlice";
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryExpiresAt, setRecoveryExpiresAt] = useState<string | null>(
    user?.recoveryCodeExpiresAt ?? null,
  );
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryCopied, setRecoveryCopied] = useState(false);

  const avatarPreview = user?.avatarUrl || user?.avatar || user?.image || "";

  useEffect(() => {
    setRecoveryExpiresAt(user?.recoveryCodeExpiresAt ?? null);
  }, [user?.recoveryCodeExpiresAt]);

  useEffect(() => {
    if (!recoveryCopied) return;
    const timer = setTimeout(() => setRecoveryCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [recoveryCopied]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => {
      setStatusMessage(null);
      setStatusType(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

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
    if (!hasNameChange) {
      setStatusMessage("Nothing to update yet.");
      setStatusType("error");
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
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

  const handleGenerateRecoveryCode = async () => {
    setRecoveryLoading(true);
    setRecoveryError(null);
    setRecoveryCode(null);
    setRecoveryCopied(false);

    try {
      const result = await dispatch(generateRecoveryCode()).unwrap();
      setRecoveryCode(result.code);
      setRecoveryExpiresAt(result.expiresAt);
      dispatch(fetchUser());
    } catch (recoveryFailure) {
      setRecoveryError(
        typeof recoveryFailure === "string"
          ? recoveryFailure
          : "Could not generate a recovery code.",
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  const copyRecoveryCode = async () => {
    if (!recoveryCode) return;

    try {
      await navigator.clipboard.writeText(recoveryCode);
      setRecoveryCopied(true);
    } catch {
      setRecoveryError("Could not copy the recovery code.");
    }
  };

  const displayMessage = statusMessage || error;
  const recoveryActive = Boolean(
    recoveryExpiresAt && new Date(recoveryExpiresAt).getTime() > Date.now(),
  );

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-6 sm:px-8 sm:py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
        Workspace / Profile
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
        Profile
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Manage your account details.
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

            <p className="mt-5 text-[10px] leading-relaxed text-ink-muted">
              Avatar images are managed by your sign-in provider.
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <h2 className="text-[14px] font-semibold text-ink">
                Password recovery
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Planex does not send email. Generate a recovery code now and
                keep it somewhere safe. You will need it to reset your password
                if you forget it.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void handleGenerateRecoveryCode()}
              loading={recoveryLoading}
              leftIcon={<KeyRound size={15} />}
            >
              Generate new code
            </Button>
          </div>

          <p className="mt-3 text-[11px] text-ink-muted">
            {recoveryActive
              ? `A recovery code is active until ${formatDate(
                  recoveryExpiresAt ?? undefined,
                )}.`
              : recoveryExpiresAt
                ? `Your last recovery code expired on ${formatDate(
                    recoveryExpiresAt,
                  )}. Generate a new one.`
                : "No recovery code yet."}
          </p>

          {recoveryCode ? (
            <div className="mt-4 rounded-lg border border-brand/25 bg-brand-soft p-4">
              <p className="text-[11px] font-semibold text-brand">
                Your new recovery code — shown once
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 rounded-md bg-surface px-3 py-2 font-mono text-[14px] tracking-[0.16em] text-ink">
                  {recoveryCode}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Copy size={14} />}
                  onClick={() => void copyRecoveryCode()}
                >
                  {recoveryCopied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-brand">
                Save it now. It will not be shown again. Expires{" "}
                {formatDate(recoveryExpiresAt ?? undefined)}.
              </p>
            </div>
          ) : null}

          {recoveryError ? (
            <p className="mt-3 text-[11px] text-danger" role="alert">
              {recoveryError}
            </p>
          ) : null}
        </CardContent>
      </Card>

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
