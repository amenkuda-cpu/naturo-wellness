"use client";

import { useSyncExternalStore } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

type Hours = (typeof siteConfig.openingHours)[number];

/** Day (0 = Sunday) and minutes since midnight, in Harare time. */
function harareNow(): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Harare",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export function openStatus(hours: readonly Hours[], now = harareNow()): { open: boolean; text: string } {
  const today = hours.find((h) => h.day === now.day);
  if (today?.opens && today.closes) {
    if (now.minutes >= toMin(today.opens) && now.minutes < toMin(today.closes)) return { open: true, text: `Open now · until ${today.closes}` };
    if (now.minutes < toMin(today.opens)) return { open: false, text: `Closed · opens today at ${today.opens}` };
  }
  for (let i = 1; i <= 7; i++) {
    const next = hours.find((h) => h.day === (now.day + i) % 7);
    if (next?.opens) return { open: false, text: `Closed · opens ${i === 1 ? "tomorrow" : next.label} at ${next.opens}` };
  }
  return { open: false, text: "Closed" };
}

/** Harare clock, refreshed each minute; null on the server so markup matches before hydration. */
const subscribeMinute = (cb: () => void) => {
  const t = window.setInterval(cb, 30_000);
  return () => window.clearInterval(t);
};
const minuteKey = () => {
  const n = harareNow();
  return `${n.day}:${n.minutes}`;
};
function useHarareNow(): { day: number; minutes: number } | null {
  const key = useSyncExternalStore(subscribeMinute, minuteKey, () => null);
  if (!key) return null;
  const [day, minutes] = key.split(":").map(Number);
  return { day, minutes };
}

/** "Open now" badge; empty until mounted so server and browser agree. */
export function OpenNowBadge({ className }: { className?: string }) {
  const now = useHarareNow();
  if (!now) return <span className={cn("inline-block h-6", className)} aria-hidden />;
  const status = openStatus(siteConfig.openingHours, now);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        status.open ? "bg-leaf/15 text-botanical" : "bg-forest/10 text-ink/75",
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", status.open ? "animate-pulse bg-botanical" : "bg-ink/40")} aria-hidden />
      {status.text}
    </span>
  );
}

/** Weekly hours, Monday first, with today highlighted (after mount). */
export function OpeningHoursTable({ className }: { className?: string }) {
  const today = useHarareNow()?.day ?? null;
  return (
    <dl className={cn("grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[0.95rem]", className)}>
      {siteConfig.openingHours.map((h) => {
        const isToday = h.day === today;
        return (
          <div key={h.day} className={cn("contents", isToday ? "font-semibold text-forest" : "text-ink/75")}>
            <dt>
              {h.label}
              {isToday && <span className="ml-2 text-xs font-semibold uppercase tracking-[0.14em] text-botanical">Today</span>}
            </dt>
            <dd className="text-right tabular-nums">{h.opens && h.closes ? `${h.opens} – ${h.closes}` : "Closed"}</dd>
          </div>
        );
      })}
    </dl>
  );
}
