"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, isAuth, token } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!loading && token && isAuth) {
      router.replace("/projects");
    }
  }, [loading, token, isAuth, router]);

  if (loading) {
    return null;
  }

  if (token && isAuth) {
    return null;
  }

  return <>{children}</>;
}
