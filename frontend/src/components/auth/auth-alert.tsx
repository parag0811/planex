import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type AlertTone = "error" | "success" | "info";

const toneClasses: Record<AlertTone, string> = {
  error: "border-danger/25 bg-danger-soft text-danger",
  success: "border-success/25 bg-success-soft text-success",
  info: "border-brand/20 bg-brand-soft text-brand",
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: AlertCircle,
};

export function AuthAlert({
  tone = "error",
  children,
}: {
  tone?: AlertTone;
  children: ReactNode;
}) {
  const Icon = icons[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed",
        toneClasses[tone],
      )}
    >
      <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
