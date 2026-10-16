import { cn } from "@/lib/cn";
import type { StaffContext } from "@/lib/auth";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export function AdminTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-forest">{title}</h1>
      {children}
    </div>
  );
}

export function DevModeBanner({ ctx }: { ctx: StaffContext }) {
  if (ctx.mode !== "dev") return null;
  return (
    <div role="note" className="mb-8 rounded-2xl border border-ember/40 bg-ember/10 p-4 text-sm text-[#7a3d0a]">
      <strong>Development mode:</strong> admin access is unauthenticated (NATURO_DEV_ADMIN=true) and data comes from the
      local dev store. This mode is disabled automatically in production builds.
    </div>
  );
}

const statusTone: Record<OrderStatus, string> = {
  pending: "bg-citrus text-forest",
  confirmed: "bg-leaf/25 text-forest",
  preparing: "bg-sky-100 text-sky-900",
  ready_for_collection: "bg-violet-100 text-violet-900",
  out_for_delivery: "bg-violet-100 text-violet-900",
  completed: "bg-forest text-warm",
  cancelled: "bg-hibiscus/10 text-hibiscus",
};
const payTone: Record<PaymentStatus, string> = {
  unpaid: "bg-cream text-ink",
  pending: "bg-citrus text-forest",
  paid: "bg-leaf/25 text-forest",
  failed: "bg-hibiscus/10 text-hibiscus",
  refunded: "bg-cream text-ink",
  cancelled: "bg-hibiscus/10 text-hibiscus",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusTone[status])}>{status.replace(/_/g, " ")}</span>;
}
export function PaymentPill({ status }: { status: PaymentStatus }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", payTone[status])}>{status}</span>;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-forest/10 bg-warm p-6", className)}>{children}</div>;
}
