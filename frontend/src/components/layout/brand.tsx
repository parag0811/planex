import Link from "next/link";
import { cn } from "@/src/lib/cn";

export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex items-center", className)}
      aria-label="Planex home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/planex-logo.svg"
        alt="Planex"
        width={144}
        height={44}
        className="h-8 w-auto"
      />
    </Link>
  );
}
