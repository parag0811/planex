"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { useRouter } from "next/navigation";
import FullPageLoader from "@/src/components/common/FullPageLoader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authCheckLoading, isAuth, token } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!authCheckLoading && token && isAuth) {
      const redirect = sessionStorage.getItem("postLoginRedirect") || "/projects";
      sessionStorage.removeItem("postLoginRedirect");
      router.replace(redirect);
    }
  }, [authCheckLoading, token, isAuth, router]);

  if (authCheckLoading) {
    return <FullPageLoader subtitle="Restoring your session..." />;
  }

  if (token && isAuth) {
    return <FullPageLoader subtitle="Redirecting to projects..." />;
  }

  return <>{children}</>;
}
