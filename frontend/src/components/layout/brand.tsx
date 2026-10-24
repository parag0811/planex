import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/src/lib/cn";

export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-brand-contrast">
        <Layers size={18} strokeWidth={1.6} />
      </span>
      <span className="text-[21px] leading-none tracking-tight text-ink">
        planex
      </span>
    </Link>
  );
}
