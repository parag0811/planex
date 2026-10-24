"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input, type InputProps } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";

export function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-20", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-3 top-0 flex h-10 items-center gap-1 text-[11px] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
