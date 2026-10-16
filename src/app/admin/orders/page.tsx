import Link from "next/link";
import { AdminTitle, Card, DevModeBanner, PaymentPill, StatusPill } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/commerce/pricing";
import { getStaffRepository } from "@/lib/repositories";
import type { OrderStatus } from "@/lib/types";

const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

// Staff data is always read per request.
export const instant = false;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await requireStaff();
  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.id === status)?.id ?? "all";
  const repo = await getStaffRepository(ctx);
  const orders = await repo.listOrders({ status: active === "all" ? undefined : active, limit: 300 });

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Orders" />
      <nav aria-label="Filter orders" className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`}
            aria-current={active === f.id ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
              active === f.id ? "bg-forest text-warm" : "bg-warm text-ink/70 hover:bg-forest/5",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-forest/10 text-ink/70">
            <tr>
              <th className="p-4 font-medium">Order</th>
              <th className="p-4 font-medium">Placed</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Fulfilment</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Payment</th>
              <th className="p-4 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-forest/5 last:border-0 hover:bg-cream/60">
                <td className="p-4"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">{o.orderNumber}</Link></td>
                <td className="p-4 text-ink/70">{new Date(o.createdAt).toLocaleString("en-ZW", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="p-4">{o.customer.fullName}<span className="block text-xs text-ink/70">{o.customer.phone}</span></td>
                <td className="p-4 capitalize">{o.fulfilment.method}</td>
                <td className="p-4"><StatusPill status={o.status} /></td>
                <td className="p-4"><PaymentPill status={o.paymentStatus} /><span className="block text-xs text-ink/70">{o.paymentMethod.replace(/_/g, " ")}</span></td>
                <td className="p-4 text-right tabular-nums">{formatMoney(o.total, o.currency)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-ink/70">No orders match this filter.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
