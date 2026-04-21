"use client";

type FullPageLoaderProps = {
  title?: string;
  subtitle?: string;
};

export default function FullPageLoader({
  title = "Initializing Workspace",
  subtitle = "Preparing your dashboard...",
}: FullPageLoaderProps) {
  return (
    <div className="min-h-screen bg-[#06070c] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10141d] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f97316]" />
        <p className="text-sm font-semibold tracking-[0.12em] uppercase text-[#f97316]">
          {title}
        </p>
        <p className="mt-2 text-sm text-[#8b93a6]">{subtitle}</p>
      </div>
    </div>
  );
}