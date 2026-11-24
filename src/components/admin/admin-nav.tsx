"use client";

import { Bell, LogOut, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/tracking", label: "Live map" },
  { href: "/admin/enquiries", label: "Queries" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/finance", label: "Profit" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings" },
];

function isActive(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path.startsWith(href);
}

/** The pill tab group from the reference: a dot, then tabs; the active one is a white pill. */
export function AdminTabs({ badges = {} }: { badges?: Record<string, number> }) {
  const path = usePathname();
  const router = useRouter();
  // The tab you click lights up immediately, before the page has loaded.
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const pending = clicked && clicked.from === path && !isActive(path, clicked.href) ? clicked.href : null;
  const warm = (href: string) => router.prefetch(href);
  return (
    <nav aria-label="Admin sections" className="no-scrollbar relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--a-line)] bg-[var(--a-card)] p-1.5">
      {pending && <span className="admin-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-[var(--a-accent)]" aria-hidden />}
      <span className="ml-1.5 mr-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--a-accent)]" aria-hidden />
      {TABS.map((t) => {
        const on = pending ? pending === t.href : isActive(path, t.href);
        const n = badges[t.href];
        return (
          <Link
            key={t.href}
            href={t.href}
            onMouseEnter={() => warm(t.href)}
            onFocus={() => warm(t.href)}
            onTouchStart={() => warm(t.href)}
            onClick={() => setClicked({ href: t.href, from: path })}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
              on ? "bg-[var(--a-pill)] text-[var(--a-pill-ink)]" : "text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink)]",
            )}
          >
            {t.label}
            {n ? (
              <span className={cn("grid min-w-5 place-items-center rounded-full px-1 text-[0.7rem] font-bold", on ? "bg-[var(--a-pill-ink)] text-[var(--a-pill)]" : "bg-[#E2457E] text-white")}>{n}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Round icon buttons on the right: search orders, alerts, and the account menu. */
export function AdminActions({ who, initial, alerts, signOut }: { who: string; initial: string; alerts: number; signOut?: () => Promise<void> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const round = "grid h-11 w-11 place-items-center rounded-full border border-[var(--a-line)] bg-[var(--a-card)] text-[var(--a-ink)] transition hover:bg-[var(--a-hover)]";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block">
        <ThemeToggle />
      </div>
      {searching ? (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            router.push(`/admin/orders?status=all&q=${encodeURIComponent(String(q ?? ""))}`);
            setSearching(false);
          }}
        >
          <input
            name="q"
            autoFocus
            onBlur={() => setSearching(false)}
            placeholder="Order, name or phone"
            aria-label="Search orders"
            className="h-11 w-56 rounded-full border border-[var(--a-line)] bg-[var(--a-card)] px-4 text-sm text-[var(--a-ink)] outline-none placeholder:text-[var(--a-muted)] focus:border-[#9B7BF7]"
          />
        </form>
      ) : (
        <button type="button" className={round} onClick={() => setSearching(true)} aria-label="Search orders">
          <Search className="h-[18px] w-[18px]" aria-hidden />
        </button>
      )}
      <Link href="/admin/orders?status=pending" className={cn(round, "relative")} aria-label={`${alerts} items need attention`}>
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {alerts > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#E2457E] ring-2 ring-[var(--a-card)]" aria-hidden />}
      </Link>
      <div className="relative" ref={menu}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Account menu"
          className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#F07F36] via-[#E2457E] to-[#9B7BF7] text-sm font-bold uppercase text-white ring-2 ring-[var(--a-line)]"
        >
          {initial}
        </button>
        {open && (
          <div className="absolute right-0 top-[52px] z-50 w-60 rounded-[20px] border border-[var(--a-line)] bg-[var(--a-inset)] p-2 shadow-2xl">
            <p className="truncate px-3 pb-2 pt-1 text-xs text-[var(--a-muted)]" title={who}>{who}</p>
            <Link href="/admin/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm hover:bg-[var(--a-hover)]">
              <UserRound className="h-4 w-4" aria-hidden /> My account
            </Link>
            <div className="flex items-center justify-between px-3 py-2 sm:hidden">
              <span className="text-sm">Theme</span>
              <ThemeToggle compact />
            </div>
            <Link href="/" target="_blank" className="flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm hover:bg-[var(--a-hover)]">
              <span className="h-4 w-4 text-center" aria-hidden>↗</span> View shop
            </Link>
            {signOut && (
              <form action={signOut}>
                <button className="flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-sm text-[var(--c-bad)] hover:bg-[var(--a-hover)]">
                  <LogOut className="h-4 w-4" aria-hidden /> Sign out
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
