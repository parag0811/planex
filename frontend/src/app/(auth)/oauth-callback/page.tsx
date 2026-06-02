"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import FullPageLoader from "@/src/components/common/FullPageLoader";
import { fetchUser } from "@/src/store/slices/authSlice";
import { setToken } from "@/src/store/slices/authSlice";
import type { AppDispatch } from "@/src/store/store";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorMessage = searchParams.get("error");
    const token = searchParams.get("token");

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    if (!token) {
      setError("Missing token. Please try logging in again.");
      return;
    }

    localStorage.setItem("token", token);
    dispatch(setToken(token));

    dispatch(fetchUser())
      .unwrap()
      .then(() => router.replace("/projects"))
      .catch(() => {
        localStorage.removeItem("token");
        setError("Failed to fetch user. Please try again.");
      });
  }, [dispatch, router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#06070c] flex items-center justify-center px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10141d] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <p className="text-sm font-semibold tracking-[0.12em] uppercase text-[#f97316]">
            OAuth Error
          </p>
          <p className="mt-2 text-sm text-[#8b93a6]">{error}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full rounded-xl bg-[#f97316] py-2.5 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#ea6c0a]"
            >
              Go to Login
            </Link>
            <Link
              href="/register"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FullPageLoader
      title="Signing you in"
      subtitle="Verifying account and loading your workspace..."
    />
  );
}
