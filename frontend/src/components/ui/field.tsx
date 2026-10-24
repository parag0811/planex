import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-[13px] leading-none text-ink"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p className="text-[11px] leading-relaxed text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
