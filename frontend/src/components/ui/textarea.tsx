import type { ComponentProps } from "react";
import { cn } from "@/src/lib/cn";

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({
  className,
  invalid,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      className={cn(
        "w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-xs leading-relaxed text-ink outline-none transition",
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
