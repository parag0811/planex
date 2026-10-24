import type { ComponentProps } from "react";
import { cn } from "@/src/lib/cn";

export interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

export function Input({
  className,
  invalid,
  type = "text",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      className={cn(
        "h-10 w-full rounded-lg border border-line bg-surface px-3 text-xs text-ink outline-none transition",
        "placeholder:text-ink-muted",
        "focus:border-brand focus:ring-2 focus:ring-brand/10",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
        "aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/10",
        className,
      )}
      {...props}
    />
  );
}
