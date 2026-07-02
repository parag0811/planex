"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store/store";
import { joinProjectByToken } from "@/src/store/slices/projectSlice";
import FullPageLoader from "@/src/components/common/FullPageLoader";
import { motion } from "framer-motion";

const BG = "#141414";
const ACCENT = "#FF5D1F";
const BORDER = "#2A2A2E";
const MUTED = "#71717A";

const MONO: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
};
const INTER: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};

export default function InvitePage() {
  const { projectName, token } = useParams<{ projectName: string; token: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { isAuth, authCheckLoading } = useSelector((state: RootState) => state.auth);
  const { join } = useSelector((state: RootState) => state.project);

  useEffect(() => {
    if (authCheckLoading) return;

    if (!isAuth) {
      sessionStorage.setItem("postLoginRedirect", window.location.pathname);
      router.replace("/login");
    }
  }, [isAuth, authCheckLoading, router]);

  if (authCheckLoading || !isAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <FullPageLoader subtitle="Verifying authentication..." />
      </div>
    );
  }

  const handleJoin = async () => {
    if (!token) return;
    try {
      await dispatch(joinProjectByToken(token)).unwrap();
      router.push("/projects");
    } catch (error) {
      // Error is handled in the UI via Redux state
    }
  };

  const displayName = projectName ? projectName.toUpperCase() : "THIS WORKSPACE";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: BG, ...INTER }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg border p-10"
        style={{ borderColor: BORDER, backgroundColor: "#0b0b0c" }}
      >
        <div className="mb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4" style={{ ...MONO, color: ACCENT }}>
            Invitation
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-4">
            Join {displayName}
          </h1>
          <p className="text-sm" style={{ color: MUTED }}>
            You have been invited to collaborate on this workspace.
          </p>
        </div>

        {join.error && (
          <div className="mb-6 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {join.error}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={join.loading}
          className="w-full border py-4 text-[11px] font-bold uppercase tracking-[0.25em] transition-colors hover:bg-[#FF5D1F] hover:text-black"
          style={{
            ...MONO,
            borderColor: ACCENT,
            color: join.loading ? ACCENT : "#FF5D1F",
            backgroundColor: join.loading ? `${ACCENT}1A` : "transparent",
            opacity: join.loading ? 0.7 : 1,
            cursor: join.loading ? "not-allowed" : "pointer",
          }}
        >
          {join.loading ? "JOINING WORKSPACE..." : "ACCEPT INVITATION"}
        </button>

        <div className="mt-8 pt-6 border-t flex justify-center" style={{ borderColor: BORDER }}>
          <button
            onClick={() => router.push("/projects")}
            className="text-[10px] font-bold uppercase tracking-[0.2em] transition hover:text-white"
            style={{ ...MONO, color: MUTED }}
          >
            Cancel & Return to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
