"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";

export const useRedirectIfAuthenticated = () => {
  const router = useRouter();
  const { authCheckLoading, isAuth } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!authCheckLoading && isAuth) {
      const next =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      const destination =
        next && next.startsWith("/") ? next : "/projects";
      router.replace(destination);
    }
  }, [authCheckLoading, isAuth, router]);

  return {
    isCheckingAuth: authCheckLoading || isAuth,
    isAuth,
  };
};
