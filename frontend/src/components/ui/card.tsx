import type { ComponentProps } from "react";
import { cn } from "@/src/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-line bg-surface", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
