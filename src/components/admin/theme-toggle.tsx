"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ADMIN_THEME_KEY } from "@/lib/admin-theme";
import { cn } from "@/lib/cn";

/** Light / dark / device theme for the admin, remembered in this browser. */

export type ThemeChoice = "light" | "dark" | "system";
const KEY = ADMIN_THEME_KEY;
const EVENT = "naturo-admin-theme";

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

function apply(choice: ThemeChoice) {
  const resolved = choice === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : choice;
  document.getElementById("admin-root")?.setAttribute("data-theme", resolved);
}

function subscribe(cb: () => void) {
  const mq = matchMedia("(prefers-color-scheme: light)");
  const onSystem = () => read() === "system" && apply("system");
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  mq.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    mq.removeEventListener("change", onSystem);
  };
}

const OPTIONS: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Match device", icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const choice = useSyncExternalStore(subscribe, read, () => "dark" as ThemeChoice);
  const set = (c: ThemeChoice) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* private mode: still switch for this visit */
    }
    apply(c);
    window.dispatchEvent(new Event(EVENT));
  };
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center gap-0.5 rounded-full border border-[var(--a-line)] bg-[var(--a-card)] p-1">
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={choice === id}
          aria-label={label}
          title={label}
          onClick={() => set(id)}
          className={cn(
            "grid place-items-center rounded-full transition",
            compact ? "h-8 w-8" : "h-9 w-9",
            choice === id ? "bg-[var(--a-pill)] text-[var(--a-pill-ink)]" : "text-[var(--a-muted)] hover:text-[var(--a-ink)]",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
