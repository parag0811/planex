"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AuthAlert } from "@/src/components/auth/auth-alert";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { OAuthButtons } from "@/src/components/auth/oauth-buttons";
import { PasswordInput } from "@/src/components/auth/password-input";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { useRedirectIfAuthenticated } from "@/src/hooks/useRedirectIfAuthenticated";
import { clearAuthErrors, registerUser } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { registerLoading, registerError } = useSelector(
    (state: RootState) => state.auth,
  );
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(clearAuthErrors());
  }, [dispatch]);

  const update =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
      if (registerError) dispatch(clearAuthErrors());
    };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const password = form.password.trim();

    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (password.length < 12) {
      errors.password = "Use at least 12 characters.";
    } else if (!/\d/.test(password)) {
      errors.password = "Include at least one number.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(
        registerUser({
          name: form.name.trim(),
          email: form.email,
          password,
        }),
      ).unwrap();

      const next = new URLSearchParams(window.location.search).get("next");
      const suffix = next ? `&next=${encodeURIComponent(next)}` : "";
      router.push(`/login?registered=true${suffix}`);
    } catch (err: unknown) {
      const payload = err as { fieldErrors?: Record<string, string> };
      if (payload?.fieldErrors) {
        setFieldErrors(payload.fieldErrors);
      }
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
          aria-label="Checking your session"
        />
      </div>
    );
  }

  return (
    <AuthShell mode="register">
      <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
        <div className="space-y-3">
          <p className="font-mono text-[11px] leading-relaxed text-brand">
            A SOLID PLACE TO START
          </p>
          <h1 className="text-[32px] leading-[1.21] text-ink">
            Create your account.
          </h1>
          <p className="text-[13px] leading-[1.6] text-ink-muted">
            A little setup. A clearer path from idea to code.
          </p>
        </div>

        {registerError ? (
          <div className="mt-5">
            <AuthAlert tone="error">{registerError}</AuthAlert>
          </div>
        ) : null}

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] text-ink-muted">
            or use your email
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleRegister} noValidate className="space-y-4">
          <Field label="Full name" htmlFor="name" error={fieldErrors.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={form.name}
              invalid={Boolean(fieldErrors.name)}
              onChange={update("name")}
            />
          </Field>

          <Field label="Email address" htmlFor="email" error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="alex@company.com"
              value={form.email}
              invalid={Boolean(fieldErrors.email)}
              onChange={update("email")}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={fieldErrors.password}
            hint="Use at least 12 characters, including a number."
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={form.password}
              invalid={Boolean(fieldErrors.password)}
              onChange={update("password")}
            />
          </Field>

          <p className="text-[11px] leading-[1.65] text-ink-muted">
            By creating an account, you agree to our{" "}
            <Link href="#" className="text-brand hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-brand hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <Button
            type="submit"
            className="w-full"
            loading={registerLoading}
          >
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand transition-colors hover:text-brand-hover hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
