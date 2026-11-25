import { Truck, Inbox, Search, Store } from "lucide-react";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/live";
import {
  AdminTitle,
  Card,
  DevModeBanner,
  EmptyState,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABEL,
  PaymentPill,
  StatusPill,
  field,
  harareTime,
  timeAgo,
  tones,
} from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { requestNow } from "@/lib/ops/metrics";
import { getStaffRepository } from "@/lib/repositories";
import type { OrderStatus } from "@/lib/types";

const FILTERS: (OrderStatus | "all" | "open")[] = ["open", "all", "pending", "confirmed", "preparing", "out_for_delivery", "ready_for_collection", "completed", "cancelled"];

// Staff data is always read per request.
export const instant = false;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; deleted?: string }> }) {
  const ctx = await requireStaff();
  const { status, q, deleted } = await searchParams;
  const active = FILTERS.find((f) => f === status) ?? "open";
  const repo = await getStaffRepository(ctx);
  const all = await repo.listOrders({ limit: 1000 });
  const query = (q ?? "").trim().toLowerCase();
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? all.length : f === "open" ? all.filter((o) => !["completed", "cancelled"].includes(o.status)).length : all.filter((o) => o.status === f).length]));
  const orders = all
    .filter((o) => (active === "all" ? true : active === "open" ? !["completed", "cancelled"].includes(o.status) : o.status === active))
    .filter((o) => !query || [o.orderNumber, o.customer.fullName, o.customer.phone, o.customer.email ?? ""].some((v) => v.toLowerCase().includes(query)));
  const label = (f: string) => (f === "all" ? "All" : f === "open" ? "Open" : ORDER_STATUS_META[f as OrderStatus].label);
  const href = (f: string) => `/admin/orders?status=${f}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
  const now = requestNow();

  return (
    <>
      <AutoRefresh seconds={30} />
      <DevModeBanner ctx={ctx} />
      {deleted && (
        <p role="status" className="mb-4 rounded-[16px] bg-[var(--a-inset)] px-4 py-3 text-sm text-[var(--a-ink)]">
          Order <b>{deleted.slice(0, 40)}</b> was deleted.
        </p>
      )}
      <AdminTitle title="Orders" subtitle="Every order placed on getnaturo.com, newest first. This page refreshes by itself.">
        <form className="relative w-full sm:w-80" role="search">
          <input type="hidden" name="status" value={active} />
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-muted)]" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Order number, name or phone" className={`${field} pl-10`} aria-label="Search orders" />
        </form>
      </AdminTitle>

      <nav aria-label="Filter orders" className="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const on = active === f;
          const t = f === "all" || f === "open" ? tones.green : tones[ORDER_STATUS_META[f].tone];
          return (
            <Link key={f} href={href(f)} aria-current={on ? "page" : undefined} className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition" style={{ backgroundColor: on ? t.base : "var(--a-card)", color: on ? "#fff" : "var(--a-muted)" }}>
              {label(f)}
              <span className="rounded-full px-1.5 text-xs font-bold" style={{ backgroundColor: on ? "rgba(255,255,255,0.25)" : t.tint, color: on ? "#fff" : t.ink }}>{counts[f]}</span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <EmptyState icon={Inbox} title={query ? "No orders match that search" : "No orders here"}>
          {all.length === 0 ? "When a customer checks out on the website, the order lands here straight away." : "Try another filter."}
        </EmptyState>
      ) : (
        <>
          {/* Cards on phones */}
          <ul className="space-y-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block rounded-[22px] border border-[var(--a-line)] bg-[var(--a-card)] p-4 ">
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-bold text-[var(--a-ink)]">{o.customer.fullName}</span>
                      <span className="block text-xs text-[var(--a-muted)]">{o.orderNumber} · {timeAgo(o.createdAt, now)}</span>
                    </span>
                    <span className="font-extrabold tabular-nums text-[var(--a-ink)]">{formatMoney(o.total, o.currency)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5"><StatusPill status={o.status} /><PaymentPill status={o.paymentStatus} /></div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Table on larger screens */}
          <Card className="hidden overflow-x-auto p-0 sm:p-0 md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-[var(--a-line)] text-[var(--a-muted)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order</th>
                  <th className="px-3 py-4 font-semibold">Customer</th>
                  <th className="px-3 py-4 font-semibold">How</th>
                  <th className="px-3 py-4 font-semibold">Status</th>
                  <th className="px-3 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--a-line)] last:border-0 hover:bg-[var(--a-inset)]">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-[var(--a-ink)] hover:underline">{o.orderNumber}</Link>
                      <span className="block text-xs text-[var(--a-muted)]" title={harareTime(o.createdAt)}>{timeAgo(o.createdAt, now)}</span>
                    </td>
                    <td className="px-3 py-3.5">{o.customer.fullName}<span className="block text-xs text-[var(--a-muted)]">{o.customer.phone}</span></td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[var(--a-muted)]">
                        {o.fulfilment.method === "delivery" ? <Truck className="h-4 w-4" aria-hidden /> : <Store className="h-4 w-4" aria-hidden />}
                        {o.fulfilment.method === "delivery" ? o.fulfilment.zoneName ?? "Delivery" : "Collection"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-3.5"><PaymentPill status={o.paymentStatus} /><span className="mt-1 block text-xs text-[var(--a-muted)]">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</span></td>
                    <td className="px-5 py-3.5 text-right font-bold tabular-nums text-[var(--a-ink)]">{formatMoney(o.total, o.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
