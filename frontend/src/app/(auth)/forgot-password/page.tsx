"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AuthAlert } from "@/src/components/auth/auth-alert";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { PasswordInput } from "@/src/components/auth/password-input";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { clearAuthErrors, resetPassword } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

function ForgotPasswordForm() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loginLoading, error } = useSelector(
    (state: RootState) => state.auth,
  );

  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(clearAuthErrors());
  }, [dispatch]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!recoveryCode.trim()) {
      errors.recoveryCode = "Recovery code is required.";
    }
    if (password.length < 12) {
      errors.password = "Password must be at least 12 characters.";
    } else if (!/\d/.test(password)) {
      errors.password = "Password must include at least one number.";
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(
        resetPassword({
          email,
          recoveryCode,
          password,
        }),
      ).unwrap();
      router.replace("/projects");
    } catch (err: unknown) {
      const payload = err as { fieldErrors?: Record<string, string> };
      if (payload?.fieldErrors) {
        setFieldErrors(payload.fieldErrors);
      }
    }
  };

  return (
    <AuthShell mode="forgot">
      <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
        <p className="font-mono text-[11px] leading-relaxed text-brand">
          ACCOUNT RECOVERY
        </p>
        <h1 className="mt-3 text-[32px] leading-[1.21] text-ink">
          Set a new password.
        </h1>
        <p className="mt-2 text-[13px] leading-[1.6] text-ink-muted">
          Enter your email and the recovery code saved from your profile.
        </p>

        {error ? (
          <div className="mt-5">
            <AuthAlert tone="error">{error}</AuthAlert>
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Email" htmlFor="recovery-email" error={fieldErrors.email}>
            <Input
              id="recovery-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              invalid={Boolean(fieldErrors.email)}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field
            label="Recovery code"
            htmlFor="recovery-code"
            error={fieldErrors.recoveryCode}
            hint="Format: XXXX-XXXX-XXXX-XXXX"
          >
            <Input
              id="recovery-code"
              autoComplete="one-time-code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={recoveryCode}
              invalid={Boolean(fieldErrors.recoveryCode)}
              onChange={(event) => setRecoveryCode(event.target.value)}
              className="font-mono"
            />
          </Field>

          <Field
            label="New password"
            htmlFor="recovery-password"
            error={fieldErrors.password}
            hint="At least 12 characters and one number."
          >
            <PasswordInput
              id="recovery-password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={password}
              invalid={Boolean(fieldErrors.password)}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Field
            label="Confirm new password"
            htmlFor="recovery-confirm"
            error={fieldErrors.confirmPassword}
          >
            <PasswordInput
              id="recovery-confirm"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmPassword}
              invalid={Boolean(fieldErrors.confirmPassword)}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>

          <Button type="submit" className="w-full" loading={loginLoading}>
            Reset password
          </Button>
        </form>

        <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
          You can generate a recovery code from{" "}
          <Link href="/profile" className="text-brand hover:underline">
            Profile → Password recovery
          </Link>{" "}
          while signed in. If you never created one, sign in with Google or
          GitHub if your account uses it.
        </p>

        <p className="mt-4 text-center text-xs text-ink-muted">
          <Link
            href="/login"
            className="text-brand transition-colors hover:text-brand-hover hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
