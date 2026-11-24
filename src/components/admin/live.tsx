"use client";

/**
 * The living parts of the Naturo dashboard, after the Amey family dashboard:
 * count-up stat cards, a breathing status ring, a filling progress ring and an
 * animated revenue / profit chart. Everything honours "reduce motion".
 */
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const m = window.matchMedia(REDUCE_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
function useReducedMotion() {
  return useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE_QUERY).matches, () => false);
}

function useCountUp(target: number, duration = 1100) {
  const reduce = useReducedMotion();
  const [animated, setValue] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setValue(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);
  return reduce ? target : animated;
}

export type ValueFormat = "money" | "count" | "percent";

export function formatValue(v: number, format: ValueFormat, currency = "USD") {
  if (format === "money") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: Math.abs(v) >= 100000 ? 0 : 2 }).format(v / 100);
  }
  if (format === "percent") return `${Math.round(v)}%`;
  return Math.round(v).toLocaleString("en-US");
}

export function StatCard({
  label,
  value,
  format = "count",
  currency,
  chip,
  hint,
  index = 0,
  accent,
}: {
  label: string;
  value: number;
  format?: ValueFormat;
  currency?: string;
  chip: ReactNode;
  hint?: ReactNode;
  index?: number;
  accent: string;
}) {
  const shown = useCountUp(value);
  return (
    <div
      className="admin-rise relative overflow-hidden rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.12]" style={{ backgroundColor: accent }} aria-hidden />
      {chip}
      <p className="mt-4 text-[1.9rem] font-semibold leading-none tracking-[-0.03em] text-[var(--a-ink)] tabular-nums" aria-label={`${label}: ${formatValue(value, format, currency)}`}>
        {formatValue(shown, format, currency)}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--a-muted)]">{label}</p>
      {hint && <div className="mt-2 text-xs text-[var(--a-muted)]">{hint}</div>}
    </div>
  );
}

/** A ring that breathes in the status colour: calm when all is well, quicker when something needs attention. */
export function PulseRing({ color, period = 2600, size = 120, children, label }: { color: string; period?: number; size?: number; children: ReactNode; label: string }) {
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size * 1.3, height: size * 1.3 }} role="img" aria-label={label}>
      {[0, 0.5].map((offset) => (
        <span
          key={offset}
          className="admin-wave absolute rounded-full border-2"
          style={{ width: size, height: size, borderColor: color, animationDuration: `${period}ms`, animationDelay: `${offset * period}ms` }}
          aria-hidden
        />
      ))}
      <span className="relative grid place-items-center rounded-full border-[5px] bg-[var(--a-card)]" style={{ width: size, height: size, borderColor: color }}>
        {children}
      </span>
    </div>
  );
}

export function ProgressRing({ done, total, color, label, sub }: { done: number; total: number; color: string; label: string; sub: string }) {
  const reduce = useReducedMotion();
  const R = 46;
  const C = 2 * Math.PI * R;
  const target = total === 0 ? 0 : Math.min(1, done / total);
  const [p, setP] = useState(reduce ? target : 0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setP(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[112px] w-[112px] shrink-0" role="img" aria-label={`${label}: ${sub}`}>
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <circle cx="56" cy="56" r={R} strokeWidth="12" fill="none" style={{ stroke: "var(--a-inset)" }} />
          <circle
            cx="56"
            cy="56"
            r={R}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - p)}
            style={{ transition: reduce ? "none" : "stroke-dashoffset 900ms cubic-bezier(0.33,1,0.68,1)" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-xl font-extrabold text-[var(--a-ink)] tabular-nums">
          {total === 0 ? "–" : `${Math.round(target * 100)}%`}
        </span>
      </div>
      <div>
        <p className="font-bold text-[var(--a-ink)]">{label}</p>
        <p className="mt-1 text-sm text-[var(--a-muted)]">{sub}</p>
      </div>
    </div>
  );
}

// ── Revenue & profit chart ──────────────────────────────────────────────────

export interface ChartPoint {
  label: string;
  /** Long label for the tooltip, e.g. "Mon 18 Nov". */
  title: string;
  revenue: number;
  profit: number;
  orders: number;
}

/** Validated pair (dataviz validator, dark surface #1C1D24): passes lightness, CVD and contrast. */
export const SERIES = { revenue: "var(--s-revenue)", profit: "var(--s-profit)" };

export function MoneyChart({ points, currency = "USD", height = 220 }: { points: ChartPoint[]; currency?: string; height?: number }) {
  const reduce = useReducedMotion();
  const [inView, setShown] = useState(false);
  const shown = reduce || inView;
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  // Grow when the chart scrolls into view, like the Amey weekly chart.
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const W = 640;
  const H = height;
  const padL = 52;
  const padR = 8;
  const padT = 12;
  const padB = 26;
  const { max, min, ticks } = useMemo(() => {
    const hi = Math.max(0, ...points.map((p) => Math.max(p.revenue, p.profit)));
    const lo = Math.min(0, ...points.map((p) => p.profit));
    const step = niceStep((hi - lo) / 4 || 100);
    const top = Math.ceil(hi / step) * step || step;
    const bottom = Math.floor(lo / step) * step;
    const t: number[] = [];
    for (let v = bottom; v <= top + 0.5; v += step) t.push(v);
    return { max: top, min: bottom, ticks: t };
  }, [points]);

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const y = (v: number) => padT + plotH * (1 - (v - min) / (max - min || 1));
  const band = plotW / Math.max(1, points.length);
  const barW = Math.max(3, Math.min(26, band * 0.56));
  const cx = (i: number) => padL + band * i + band / 2;
  const fmt = (v: number) => formatValue(v, "money", currency);
  const fmtShort = (v: number) => {
    const d = v / 100;
    if (Math.abs(d) >= 1000) return `${d < 0 ? "-" : ""}$${(Math.abs(d) / 1000).toFixed(Math.abs(d) >= 10000 ? 0 : 1)}k`;
    return `${d < 0 ? "-" : ""}$${Math.abs(d).toFixed(0)}`;
  };
  const labelEvery = Math.ceil(points.length / 10);
  const linePath = points.map((p, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${y(shown ? p.profit : 0).toFixed(1)}`).join(" ");
  const h = hover !== null ? points[hover] : null;

  return (
    <div ref={ref}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex items-center gap-4 text-sm text-[var(--a-muted)]" aria-label="Legend">
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: SERIES.revenue }} />Revenue</li>
          <li className="flex items-center gap-2"><span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: SERIES.profit }} /><span className="-ml-1 h-2 w-2 rounded-full border-2 bg-[var(--a-card)]" style={{ borderColor: SERIES.profit }} />Profit</li>
        </ul>
        <button type="button" onClick={() => setTable((t) => !t)} className="text-xs font-semibold text-[var(--a-muted)] underline underline-offset-4" aria-controls={`${id}-table`} aria-expanded={table}>
          {table ? "Show chart" : "Show as table"}
        </button>
      </div>

      {table ? (
        <div id={`${id}-table`} className="max-h-[260px] overflow-auto rounded-[14px] border border-[var(--a-line)]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--a-inset)] text-[var(--a-muted)]"><tr><th className="px-3 py-2 font-medium">Period</th><th className="px-3 py-2 text-right font-medium">Orders</th><th className="px-3 py-2 text-right font-medium">Revenue</th><th className="px-3 py-2 text-right font-medium">Profit</th></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.title} className="border-t border-[var(--a-line)]"><td className="px-3 py-1.5">{p.title}</td><td className="px-3 py-1.5 text-right tabular-nums">{p.orders}</td><td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.revenue)}</td><td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.profit)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" style={{ color: SERIES.revenue }} role="img" aria-label={`Revenue and profit, ${points[0]?.title ?? ""} to ${points.at(-1)?.title ?? ""}`} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} strokeWidth={t === 0 ? 1.2 : 1} style={{ stroke: t === 0 ? "var(--a-muted)" : "var(--a-line)" }} />
                <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--a-muted)" }}>{fmtShort(t)}</text>
              </g>
            ))}
            {hover !== null && <rect x={padL + band * hover} y={padT} width={band} height={plotH} fill="#173F2B" opacity="0.04" rx="8" />}
            {points.map((p, i) => {
              const top = y(Math.max(0, p.revenue));
              const base = y(0);
              const hgt = shown ? Math.max(0, base - top) : 0;
              return (
                <rect
                  key={p.title}
                  x={cx(i) - barW / 2}
                  y={base - hgt}
                  width={barW}
                  height={hgt}
                  rx={Math.min(4, barW / 2)}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  fill="currentColor"
                  style={{ transition: reduce ? "none" : `y 700ms cubic-bezier(0.33,1,0.68,1) ${i * 18}ms, height 700ms cubic-bezier(0.33,1,0.68,1) ${i * 18}ms` }}
                />
              );
            })}
            <path d={linePath} fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: SERIES.profit, transition: reduce ? "none" : "d 800ms cubic-bezier(0.33,1,0.68,1) 250ms" }} />
            {points.map((p, i) =>
              points.length <= 31 || hover === i ? (
                <circle key={p.title} cx={cx(i)} cy={y(shown ? p.profit : 0)} r={hover === i ? 5 : 3.5} strokeWidth="2" style={{ fill: "var(--a-card)", stroke: SERIES.profit, transition: reduce ? "none" : "cy 800ms cubic-bezier(0.33,1,0.68,1) 250ms" }} />
              ) : null,
            )}
            {points.map((p, i) =>
              i % labelEvery === 0 ? (
                <text key={p.title} x={cx(i)} y={H - 6} textAnchor="middle" fontSize="11" style={{ fill: "var(--a-muted)" }}>{p.label}</text>
              ) : null,
            )}
            {points.map((p, i) => (
              <rect key={`hit-${p.title}`} x={padL + band * i} y={padT} width={band} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
            ))}
          </svg>
          {h && hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-48 rounded-[14px] border border-[var(--a-line)] bg-[var(--a-inset)] p-3 text-xs shadow-2xl"
              style={{ left: `clamp(0px, calc(${((cx(hover) / W) * 100).toFixed(2)}% - 96px), calc(100% - 192px))` }}
            >
              <p className="font-bold text-[var(--a-ink)]">{h.title}</p>
              <p className="mt-1.5 flex justify-between"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: SERIES.revenue }} />Revenue</span><span className="font-semibold tabular-nums">{fmt(h.revenue)}</span></p>
              <p className="mt-1 flex justify-between"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES.profit }} />Profit</span><span className="font-semibold tabular-nums">{fmt(h.profit)}</span></p>
              <p className="mt-1 flex justify-between text-[var(--a-muted)]"><span>Orders</span><span className="tabular-nums">{h.orders}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function niceStep(raw: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.abs(raw))));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** Thin stacked bar showing where orders are in the pipeline. */
export function PipelineBar({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.count, 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[var(--a-inset)]" role="img" aria-label={segments.map((s) => `${s.label} ${s.count}`).join(", ")}>
        {total > 0 &&
          segments.filter((s) => s.count > 0).map((s) => (
            <span key={s.label} className="admin-grow h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }} />
          ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        {segments.map((s) => (
          <li key={s.label} className={cn("flex items-center justify-between gap-2", s.count === 0 && "opacity-60")}>
            <span className="flex items-center gap-2 text-[var(--a-muted)]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}</span>
            <span className="font-bold tabular-nums text-[var(--a-ink)]">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Re-renders the server page every `seconds` so new orders appear without a manual refresh. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(t);
  }, [seconds, router]);
  return null;
}

// ── Reference-style pieces: revenue flow bars, expense donut ───────────────

/**
 * "Revenue flow": tall rounded translucent bars with the value inside, the
 * latest period highlighted with a floating chip. Single series (revenue).
 */
export function RevenueFlow({ points, currency = "USD", height = 190 }: { points: { label: string; title: string; value: number }[]; currency?: string; height?: number }) {
  const reduce = useReducedMotion();
  const [grown, setGrown] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const max = Math.max(1, ...points.map((p) => p.value));
  const active = hover ?? points.length - 1;
  const short = (v: number) => {
    const d = v / 100;
    return d >= 1000 ? `$${(d / 1000).toFixed(1)}k` : `$${Math.round(d)}`;
  };
  const prev = points.at(-2)?.value ?? 0;
  const last = points.at(-1)?.value ?? 0;
  const change = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <ol className="flex items-end gap-2.5 sm:gap-3" style={{ height }} aria-label="Revenue by period">
        {points.map((p, i) => {
          const h = Math.max(14, (p.value / max) * (height - 34));
          const on = i === active;
          return (
            <li key={p.title} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2" onMouseEnter={() => setHover(i)}>
              {on && (
                <span className="absolute z-10 -translate-y-1 whitespace-nowrap rounded-full border border-[var(--a-line)] bg-[var(--a-inset)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--a-ink)] shadow-xl" style={{ bottom: h + 30 }}>
                  {formatValue(p.value, "money", currency)}
                  {i === points.length - 1 && change !== null && <span className={change >= 0 ? "ml-1 text-[var(--c-ok)]" : "ml-1 text-[var(--c-bad)]"}>{change >= 0 ? "+" : ""}{change}%</span>}
                </span>
              )}
              <span
                className="relative flex w-full items-end justify-center overflow-hidden rounded-[18px] pb-2 text-[0.68rem] font-semibold"
                style={{
                  height: grown || reduce ? h : 14,
                  transition: reduce ? "none" : `height 800ms cubic-bezier(0.33,1,0.68,1) ${i * 60}ms`,
                  background: on ? "linear-gradient(180deg,#CDBDFF 0%,#9B7BF7 100%)" : "linear-gradient(180deg,rgba(155,123,247,0.55) 0%,rgba(155,123,247,0.22) 100%)",
                  color: on ? "#14151B" : "var(--t-violet)",
                }}
                title={`${p.title}: ${formatValue(p.value, "money", currency)}`}
              >
                {h > 40 && short(p.value)}              </span>
              <span className={on ? "text-xs font-semibold text-[var(--a-ink)]" : "text-xs text-[var(--a-muted)]"}>{p.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** "Expense split": thick ring with rounded segments and a total in the middle. */
export function Donut({ segments, total, currency = "USD", label = "Total" }: { segments: { label: string; value: number; color: string }[]; total: number; currency?: string; label?: string }) {
  const reduce = useReducedMotion();
  const [p, setP] = useState(reduce ? 1 : 0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setP(1));
    return () => cancelAnimationFrame(id);
  }, []);
  const R = 60;
  const C = 2 * Math.PI * R;
  const gap = segments.length > 1 ? 6 : 0;
  let offset = 0;
  return (
    <div className="relative h-[164px] w-[164px] shrink-0" role="img" aria-label={`${label} ${formatValue(total, "money", currency)}: ${segments.map((s) => `${s.label} ${formatValue(s.value, "money", currency)}`).join(", ")}`}>
      <svg viewBox="0 0 164 164" className="h-full w-full -rotate-90">
        <circle cx="82" cy="82" r={R} fill="none" strokeWidth="18" style={{ stroke: "var(--a-inset)" }} />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const dash = Math.max(0.1, len - gap) * p;
            const el = (
              <circle
                key={s.label}
                cx="82"
                cy="82"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C}`}
                strokeDashoffset={-offset}
                style={{ transition: reduce ? "none" : "stroke-dasharray 900ms cubic-bezier(0.33,1,0.68,1)" }}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="block text-xs text-[var(--a-muted)]">{label}</span>
          <span className="block text-xl font-semibold tracking-[-0.02em] text-[var(--a-ink)] tabular-nums">{formatValue(total, "money", currency)}</span>
        </span>
      </span>
    </div>
  );
}

// ── Gauge ───────────────────────────────────────────────────────────────────

/**
 * A plain gauge: a half ring that fills to the value in one status colour
 * (green good, amber fair, pink needs attention), with the number inside.
 * `goodHigh=false` flips the colours for things where lower is better.
 */
export function Gauge({
  value,
  max = 100,
  label,
  display,
  sub,
  goodHigh = true,
}: {
  value: number | null;
  max?: number;
  label: string;
  /** What to print in the middle, e.g. "86%" or "42 min". */
  display: string;
  sub?: string;
  goodHigh?: boolean;
}) {
  const reduce = useReducedMotion();
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const frac = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  const shown = reduce || filled ? frac : 0;
  const R = 80;
  const C = Math.PI * R;
  const level = value === null ? null : goodHigh ? (frac >= 0.7 ? "good" : frac >= 0.4 ? "fair" : "low") : frac <= 0.4 ? "good" : frac <= 0.7 ? "fair" : "low";
  const color = level === "good" ? "var(--s-profit)" : level === "fair" ? "#E9B10C" : level === "low" ? "#E2457E" : "var(--a-muted)";

  return (
    <figure className="flex min-w-0 flex-col items-center text-center" aria-label={`${label}: ${display}${sub ? `, ${sub}` : ""}`}>
      <div className="relative w-full max-w-[220px]">
        <svg viewBox="0 0 200 110" className="w-full" role="img" aria-hidden>
          <path d={`M 20 100 A ${R} ${R} 0 0 1 180 100`} fill="none" strokeWidth="16" strokeLinecap="round" style={{ stroke: "var(--a-inset)" }} />
          <path
            d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
            fill="none"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - shown)}
            style={{ stroke: color, transition: reduce ? "none" : "stroke-dashoffset 900ms cubic-bezier(0.33,1,0.68,1)" }}
          />
        </svg>
        <span className="absolute inset-x-0 bottom-1 text-[1.7rem] font-semibold leading-none tracking-[-0.02em] tabular-nums">{display}</span>
      </div>
      <figcaption className="mt-2">
        <span className="block text-sm font-medium">{label}</span>
        {sub && <span className="block text-xs text-[var(--a-muted)]">{sub}</span>}
      </figcaption>
    </figure>
  );
}
