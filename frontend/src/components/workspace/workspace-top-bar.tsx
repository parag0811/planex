"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { Brand } from "@/src/components/layout/brand";
import { Avatar } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { logout } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

export function WorkspaceTopBar({
  projectName,
  onMenuToggle,
}: {
  projectName: string;
  onMenuToggle: () => void;
}) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = user?.name || user?.email || "Your account";
  const avatarSrc =
    user?.avatarUrl || user?.avatar || user?.image || user?.picture || "";

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open project navigation"
          className="rounded p-1.5 text-ink-soft transition-colors hover:bg-surface-muted lg:hidden"
        >
          <Menu size={18} />
        </button>

        <Brand href="/projects" className="shrink-0" />

        <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />
        <ChevronRight
          size={14}
          className="hidden shrink-0 text-ink-muted sm:block"
        />
        <span className="truncate text-[13px] text-ink">{projectName}</span>
        <Badge tone="neutral" className="hidden shrink-0 sm:inline-flex">
          Private project
        </Badge>
      </div>

      <div className="flex items-center gap-6">
        <Link
          href="#"
          aria-label="Help"
          className="hidden text-ink-muted transition-colors hover:text-ink sm:block"
        >
          <CircleHelp size={18} strokeWidth={1.6} />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full p-0.5 transition-opacity hover:opacity-80"
          >
            <Avatar src={avatarSrc} name={displayName} size="xs" />
            <ChevronDown size={14} className="hidden text-ink-muted sm:block" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-popover"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-[13px] font-medium text-ink">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-ink-muted">
                  {user?.email || "Signed in"}
                </p>
              </div>
              <div className="p-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  <User size={14} />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
