"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { useRouter } from "next/navigation";
import Header from "@/src/components/layout/Header";
import FullPageLoader from "@/src/components/common/FullPageLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, isAuth, token } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!loading && (!token || !isAuth)) {
      router.replace("/login");
    }
  }, [loading, token, isAuth, router]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!token || !isAuth) {
    return <FullPageLoader subtitle="Redirecting to login..." />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}
