"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AuthAlert } from "@/src/components/auth/auth-alert";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { OAuthButtons } from "@/src/components/auth/oauth-buttons";
import { PasswordInput } from "@/src/components/auth/password-input";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { useRedirectIfAuthenticated } from "@/src/hooks/useRedirectIfAuthenticated";
import { clearAuthErrors, loginUser } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

function AuthChecking() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
        aria-label="Checking your session"
      />
    </div>
  );
}

function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  const { loginLoading, error } = useSelector(
    (state: RootState) => state.auth,
  );
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [queryError, setQueryError] = useState<string | null>(() =>
    searchParams.get("error"),
  );

  useEffect(() => {
    dispatch(clearAuthErrors());
  }, [dispatch]);

  const submitCredentials = async () => {
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (err: unknown) {
      const payload = err as { fieldErrors?: Record<string, string> };
      if (payload?.fieldErrors) {
        setFieldErrors(payload.fieldErrors);
      }
    }
  };

  if (isCheckingAuth) return <AuthChecking />;

  return (
    <AuthShell mode="login">
      <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
        <div className="space-y-3">
          <p className="font-mono text-[11px] leading-relaxed text-brand">
            YOUR WORKSPACE AWAITS
          </p>
          <h1 className="text-[32px] leading-[1.21] text-ink">
            Welcome back.
          </h1>
          <p className="text-[13px] leading-[1.6] text-ink-muted">
            Log in to keep building on your ideas.
          </p>
        </div>

        {registered ? (
          <div className="mt-5">
            <AuthAlert tone="success">
              Account created. Log in to open your workspace.
            </AuthAlert>
          </div>
        ) : null}

        {error || queryError ? (
          <div className="mt-5">
            <AuthAlert tone="error">{error || queryError}</AuthAlert>
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitCredentials();
          }}
          noValidate
          className="space-y-5"
        >
          <Field label="Email address" htmlFor="email" error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="alex@company.com"
              value={email}
              invalid={Boolean(fieldErrors.email)}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: "" }));
                }
                if (error) dispatch(clearAuthErrors());
                if (queryError) setQueryError(null);
              }}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={fieldErrors.password}
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              invalid={Boolean(fieldErrors.password)}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: "" }));
                }
                if (error) dispatch(clearAuthErrors());
                if (queryError) setQueryError(null);
              }}
            />
          </Field>

          <div className="flex justify-end">
            <Link
              href="#"
              className="text-xs text-brand transition-colors hover:text-brand-hover hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loginLoading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          New to Planex?{" "}
          <Link
            href="/register"
            className="text-brand transition-colors hover:text-brand-hover hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-canvas" />}>
      <LoginForm />
    </Suspense>
  );
}
