import Link from "next/link";
import { AdminTitle, Card, DevModeBanner, PaymentPill, StatusPill } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getCatalog } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/pricing";
import { getStaffRepository } from "@/lib/repositories";

// Staff data is always read per request.
export const instant = false;

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const ctx = await requireStaff();
  const [{ error }, repo] = await Promise.all([searchParams, getStaffRepository(ctx)]);
  const [orders, catalog] = await Promise.all([repo.listOrders({ limit: 500 }), getCatalog()]);

  const paid = orders.filter((o) => o.paymentStatus === "paid");
  const open = orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const unpriced = catalog.filter((p) => p.variants.every((v) => v.price === null));
  const currency = orders[0]?.currency ?? "USD";

  const stats = [
    { label: "Open orders", value: String(open.length) },
    { label: "Awaiting payment check", value: String(orders.filter((o) => o.paymentStatus === "pending").length) },
    { label: "Paid revenue (all time)", value: formatMoney(paid.reduce((s, o) => s + o.total, 0), currency) },
    { label: "Total orders", value: String(orders.length) },
  ];

  return (
    <>
      <DevModeBanner ctx={ctx} />
      {error === "forbidden" && (
        <p role="alert" className="mb-6 rounded-xl bg-hibiscus/10 p-4 text-sm text-hibiscus">That action requires an administrator.</p>
      )}
      <AdminTitle title="Overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-ink/70">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-forest">{s.value}</p>
          </Card>
        ))}
      </div>

      {unpriced.length > 0 && (
        <Card className="mt-6 border-ember/40 bg-ember/5">
          <p className="font-semibold text-forest">{unpriced.length} product(s) have no price and cannot be purchased:</p>
          <p className="mt-1 text-sm text-ink/70">{unpriced.map((p) => p.name).join(", ")}</p>
          <Link href="/admin/products" className="mt-3 inline-block text-sm font-semibold text-forest underline underline-offset-4">Set prices →</Link>
        </Card>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-forest">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-forest underline underline-offset-4">All orders</Link>
        </div>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-forest/10 text-ink/70">
              <tr><th className="p-4 font-medium">Order</th><th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Payment</th><th className="p-4 text-right font-medium">Total</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((o) => (
                <tr key={o.id} className="border-b border-forest/5 last:border-0 hover:bg-cream/60">
                  <td className="p-4"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">{o.orderNumber}</Link></td>
                  <td className="p-4">{o.customer.fullName}</td>
                  <td className="p-4"><StatusPill status={o.status} /></td>
                  <td className="p-4"><PaymentPill status={o.paymentStatus} /></td>
                  <td className="p-4 text-right tabular-nums">{formatMoney(o.total, o.currency)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-ink/70">No orders yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </section>
    </>
  );
}
