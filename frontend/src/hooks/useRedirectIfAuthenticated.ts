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
      router.replace("/projects");
    }
  }, [authCheckLoading, isAuth, router]);

  return {
    isCheckingAuth: authCheckLoading || isAuth,
    isAuth,
  };
};
