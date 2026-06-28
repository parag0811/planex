"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/src/components/layout/Header";
import FullPageLoader from "@/src/components/common/FullPageLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { authCheckLoading, isAuth, token } = useSelector(
    (state: RootState) => state.auth,
  );
  const isProjectDetailPage = /^\/projects\/[^/]+(?:\/.*)?$/.test(
    pathname || "",
  );

  useEffect(() => {
    if (authCheckLoading) return; // still loading, do nothing

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login"); // definitively no token, redirect
      return;
    }

    if (!isAuth) return; // has token but fetchUser not done yet, wait
  }, [authCheckLoading, isAuth, router]);

  if (authCheckLoading) {
    return <FullPageLoader />;
  }

  if (!token || !isAuth) {
    return <FullPageLoader subtitle="Redirecting to login..." />;
  }

  return (
    <>
      {!isProjectDetailPage && <Header />}
      <div className={isProjectDetailPage ? "" : "pt-16"}>{children}</div>
    </>
  );
}
