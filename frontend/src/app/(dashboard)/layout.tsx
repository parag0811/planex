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
  const { authCheckLoading, isAuth } = useSelector(
    (state: RootState) => state.auth,
  );
  const isProjectDetailPage = /^\/projects\/[^/]+(?:\/.*)?$/.test(
    pathname || "",
  );

  useEffect(() => {
    if (authCheckLoading) return;
    if (!isAuth) {
      router.replace("/login");
    }
  }, [authCheckLoading, isAuth, router]);

  let content = children;
  if (!isProjectDetailPage) {
    if (authCheckLoading) {
      content = <FullPageLoader />;
    } else if (!isAuth) {
      content = <FullPageLoader subtitle="Redirecting to login..." />;
    }
  }

  return (
    <>
      {!isProjectDetailPage && <Header />}
      <div className={isProjectDetailPage ? "h-full w-full flex flex-col" : "pt-16 min-h-screen flex flex-col"}>
        {content}
      </div>
    </>
  );
}