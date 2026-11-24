import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { StaffContext } from "@/lib/auth";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

/**
 * Naturo admin UI kit: a dark "glass" dashboard (near-black canvas, soft
 * charcoal cards, big type, one bright gradient hero) in Naturo's colours.
 */

/** Brand accents. `tint` is a translucent wash of the hue; `ink` a light step of it for text on dark (≥4.5:1). */
export const tones = {
  green: { base: "#5FA832", ink: "var(--t-green)", tint: "rgba(95,168,50,0.18)" },
  sun: { base: "#E9B10C", ink: "var(--t-sun)", tint: "rgba(233,177,12,0.16)" },
  ember: { base: "#F07F36", ink: "var(--t-ember)", tint: "rgba(240,127,54,0.17)" },
  hibiscus: { base: "#E2457E", ink: "var(--t-hibiscus)", tint: "rgba(226,69,126,0.17)" },
  violet: { base: "#9B7BF7", ink: "var(--t-violet)", tint: "rgba(155,123,247,0.18)" },
  sky: { base: "#3D9BEA", ink: "var(--t-sky)", tint: "rgba(61,155,234,0.17)" },
  teal: { base: "#1FB3A5", ink: "var(--t-teal)", tint: "rgba(31,179,165,0.17)" },
  slate: { base: "#8A8B99", ink: "var(--t-slate)", tint: "var(--a-hover)" },
} as const;
export type Tone = keyof typeof tones;

export function AdminTitle({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--a-ink)] sm:text-[2.6rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[0.95rem] text-[var(--a-muted)]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function DevModeBanner({ ctx }: { ctx: StaffContext }) {
  if (ctx.mode !== "dev") return null;
  return (
    <div role="note" className="mb-6 rounded-[20px] border border-[var(--a-line)] bg-[var(--c-warn-bg)] px-5 py-3 text-sm text-[var(--c-warn)]">
      <strong>Development preview.</strong> Admin sign in is skipped and data comes from the local dev store. This mode is
      switched off automatically on the live site.
    </div>
  );
}

export function Card({ children, className, as: As = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return (
    <As className={cn("min-w-0 rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5 backdrop-blur sm:p-6", className)}>
      {children}
    </As>
  );
}

export function CardTitle({ children, action, icon: Icon, tone = "green" }: { children: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon; tone?: Tone }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-lg font-bold text-[var(--a-ink)]">
        {Icon && <IconChip icon={Icon} tone={tone} size="sm" />}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function IconChip({ icon: Icon, tone, size = "md" }: { icon: LucideIcon; tone: Tone; size?: "sm" | "md" | "lg" }) {
  const t = tones[tone];
  const box = size === "sm" ? "h-8 w-8 rounded-[10px]" : size === "lg" ? "h-12 w-12 rounded-[16px]" : "h-10 w-10 rounded-[13px]";
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span className={cn("grid shrink-0 place-items-center", box)} style={{ backgroundColor: t.tint, color: t.ink }} aria-hidden>
      <Icon className={icon} strokeWidth={2.2} />
    </span>
  );
}

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  const t = tones[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", className)} style={{ backgroundColor: t.tint, color: t.ink }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.base }} aria-hidden />
      {children}
    </span>
  );
}

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "New", tone: "sun" },
  confirmed: { label: "Confirmed", tone: "sky" },
  preparing: { label: "Preparing", tone: "violet" },
  ready_for_collection: { label: "Ready to collect", tone: "teal" },
  out_for_delivery: { label: "On the road", tone: "ember" },
  completed: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "hibiscus" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: "Pay on delivery", tone: "slate" },
  pending: { label: "Awaiting payment", tone: "sun" },
  paid: { label: "Paid", tone: "green" },
  failed: { label: "Payment failed", tone: "hibiscus" },
  refunded: { label: "Refunded", tone: "slate" },
  cancelled: { label: "Payment cancelled", tone: "hibiscus" },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pesepay: "Pesepay",
  paynow: "Paynow",
  manual: "Transfer / mobile money",
  cash_on_delivery: "Cash on delivery",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = ORDER_STATUS_META[status];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}
export function PaymentPill({ status }: { status: PaymentStatus }) {
  const m = PAYMENT_STATUS_META[status];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function EmptyState({ icon: Icon, tone = "green", title, children }: { icon: LucideIcon; tone?: Tone; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-[var(--a-line)] bg-[var(--a-inset)] px-6 py-10 text-center">
      <IconChip icon={Icon} tone={tone} size="lg" />
      <p className="font-bold text-[var(--a-ink)]">{title}</p>
      {children && <div className="max-w-md text-sm text-[var(--a-muted)]">{children}</div>}
    </div>
  );
}

export function SetupNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="note" className="mb-6 rounded-[20px] border border-[var(--a-line)] bg-[var(--c-info-bg)] px-5 py-4 text-sm text-[var(--c-info)]">
      <p className="font-bold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--a-accent)] px-5 py-2.5 text-sm font-semibold text-[#14151B]  transition hover:brightness-110 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--a-line)] bg-[var(--a-inset)] px-5 py-2.5 text-sm font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-muted)] hover:bg-[var(--a-hover)] disabled:opacity-50",
  quiet: "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--a-ink)] hover:bg-[var(--a-inset)]",
};

export const field =
  "w-full rounded-[14px] border border-[var(--a-line)] bg-[var(--a-inset)] px-3.5 py-2.5 text-[0.95rem] text-[var(--a-ink)] outline-none transition placeholder:text-[var(--a-muted)] focus:border-[#9B7BF7] focus:bg-[var(--a-card)] focus:ring-4 focus:ring-[#9B7BF7]/20 disabled:opacity-60";

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Harare" });
}

export function harareTime(iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "Africa/Harare" }).format(new Date(iso));
}
