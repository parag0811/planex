"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Archive,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  Folder,
  LogOut,
  Menu,
  Settings2,
  User,
  X,
} from "lucide-react";
import { Avatar } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Brand } from "@/src/components/layout/brand";
import { cn } from "@/src/lib/cn";
import { logout } from "@/src/store/slices/authSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

const NAV_ITEMS = [
  { label: "Projects", href: "/projects", icon: Folder, available: true },
  { label: "Archive", href: "#", icon: Archive, available: false },
  { label: "Settings", href: "#", icon: Settings2, available: false },
] as const;

function getInitials(name?: string | null) {
  if (!name) return "AK";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function RailContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || "";
  const { user } = useSelector((state: RootState) => state.auth);
  const displayName = user?.name || user?.email || "Your workspace";
  const workspaceName = user?.name
    ? `${String(user.name).split(" ")[0]}’s workspace`
    : "Personal workspace";

  return (
    <div className="flex h-full flex-col gap-2 bg-surface px-4 py-8">
      <div className="flex h-[52px] items-center gap-2 rounded-lg p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-[11px] font-semibold text-ink">
          {getInitials(displayName)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
          {workspaceName}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-ink-muted" />
      </div>

      <nav aria-label="Workspace" className="mt-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon, available }) => {
          const active =
            available &&
            (pathname === href || pathname.startsWith(`${href}/`));

          const className = cn(
            "flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
            active
              ? "bg-brand-soft text-brand"
              : "text-ink-soft hover:bg-surface-muted hover:text-ink",
            !available && "cursor-default hover:bg-transparent",
          );

          if (!available) {
            return (
              <span
                key={label}
                className={className}
                title="Coming soon"
                aria-disabled
              >
                <Icon size={18} strokeWidth={1.6} />
                {label}
              </span>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              <Icon size={18} strokeWidth={1.6} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg bg-canvas p-4">
        <Badge tone="neutral">Personal workspace</Badge>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          A little clarity for your next big idea.
        </p>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
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
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
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
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded p-1.5 text-ink-soft transition-colors hover:bg-surface-muted lg:hidden"
          >
            <Menu size={18} />
          </button>

          <Brand href="/projects" className="shrink-0" />

          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />
          <span className="hidden text-[13px] text-ink-muted sm:block">
            Workspace
          </span>
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
              <Avatar
                src={avatarSrc}
                name={displayName}
                size="xs"
                className="rounded-full"
              />
              <ChevronDown
                size={14}
                className="hidden text-ink-muted sm:block"
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-popover"
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

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <RailContent />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface shadow-popover">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-3 z-10 rounded p-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
            >
              <X size={16} />
            </button>
            <RailContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
