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
  const { loading, isAuth, token } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!loading && token && isAuth) {
      router.replace("/projects");
    }
  }, [loading, token, isAuth, router]);

  if (loading) {
    return <FullPageLoader subtitle="Restoring your session..." />;
  }

  if (token && isAuth) {
    return <FullPageLoader subtitle="Redirecting to projects..." />;
  }

  return <>{children}</>;
}
