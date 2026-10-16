import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, Card, DevModeBanner, PaymentPill, StatusPill } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { getStaffRepository } from "@/lib/repositories";
import { recheckPaymentAction, updateOrderStatusAction, updatePaymentStatusAction } from "../../actions";

const STATUSES = ["pending", "confirmed", "preparing", "ready_for_collection", "out_for_delivery", "completed", "cancelled"] as const;

// Staff data is always read per request.
export const instant = false;

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const repo = await getStaffRepository(ctx);
  const order = await repo.getOrder(id);
  if (!order) notFound();
  const money = (v: number) => formatMoney(v, order.currency);
  const offline = order.paymentMethod !== "paynow";

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <Link href="/admin/orders" className="text-sm text-ink/70 hover:text-forest">← All orders</Link>
      <AdminTitle title={order.orderNumber}>
        <div className="flex gap-2"><StatusPill status={order.status} /><PaymentPill status={order.paymentStatus} /></div>
      </AdminTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-xl font-bold text-forest">Items</h2>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.variantId} className="border-b border-forest/5">
                    <td className="py-2">{l.quantity} × {l.name}<span className="block text-xs text-ink/70">{l.variantLabel}</span></td>
                    <td className="py-2 text-right tabular-nums">{money(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-ink/70">
                <tr><td className="pt-3">Subtotal</td><td className="pt-3 text-right tabular-nums">{money(order.subtotal)}</td></tr>
                {order.discount > 0 && <tr><td>Discount {order.promoCode && `(${order.promoCode})`}</td><td className="text-right">−{money(order.discount)}</td></tr>}
                <tr><td>Delivery</td><td className="text-right tabular-nums">{money(order.deliveryFee)}</td></tr>
                {order.tax > 0 && <tr><td>Tax</td><td className="text-right tabular-nums">{money(order.tax)}</td></tr>}
                <tr className="font-semibold text-forest"><td className="pt-2">Total</td><td className="pt-2 text-right tabular-nums">{money(order.total)}</td></tr>
              </tfoot>
            </table>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-bold text-forest">History</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {order.history.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-botanical" />
                  <span>
                    <span className="font-medium">{h.note}</span>
                    <span className="block text-xs text-ink/70">{new Date(h.at).toLocaleString("en-ZW")} · {h.actor}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl font-bold text-forest">Customer</h2>
            <p className="mt-3 font-medium">{order.customer.fullName}</p>
            <p className="text-sm"><a href={`tel:${order.customer.phone}`} className="underline">{order.customer.phone}</a></p>
            {order.customer.email && <p className="text-sm">{order.customer.email}</p>}
            <p className="mt-4 text-sm font-medium capitalize">{order.fulfilment.method}</p>
            {order.fulfilment.address && (
              <p className="text-sm text-ink/70">
                {order.fulfilment.address.line1}, {order.fulfilment.address.suburb}, {order.fulfilment.address.city}
                {order.fulfilment.address.instructions && <span className="block italic">“{order.fulfilment.address.instructions}”</span>}
                {order.fulfilment.zoneName && <span className="block">{order.fulfilment.zoneName}</span>}
              </p>
            )}
            {order.notes && <p className="mt-3 rounded-lg bg-cream p-3 text-sm">Note: {order.notes}</p>}
          </Card>

          <Card>
            <h2 className="font-display text-xl font-bold text-forest">Update status</h2>
            <form action={updateOrderStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="block text-sm">
                <span className="sr-only">Order status</span>
                <select name="status" defaultValue={order.status} className="field">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-ink/70">Internal note (optional)</span>
                <input name="note" maxLength={300} className="field" />
              </label>
              <button className="w-full rounded-full bg-forest py-3 text-xs font-semibold uppercase tracking-[0.14em] text-warm hover:bg-botanical">Save status</button>
            </form>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-bold text-forest">Payment</h2>
            <p className="mt-2 text-sm text-ink/70">Method: {order.paymentMethod.replace(/_/g, " ")}{order.paymentReference && ` · Ref ${order.paymentReference}`}</p>
            {offline ? (
              <form action={updatePaymentStatusAction} className="mt-4 space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <select name="paymentStatus" defaultValue={order.paymentStatus} className="field" aria-label="Payment status">
                  {["unpaid", "pending", "paid", "refunded", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-xs text-ink/70">Only mark as paid after you have personally verified the money was received.</p>
                <button className="w-full rounded-full border border-forest py-3 text-xs font-semibold uppercase tracking-[0.14em] text-forest hover:bg-forest hover:text-warm">Save payment status</button>
              </form>
            ) : (
              <form action={recheckPaymentAction} className="mt-4 space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <p className="text-xs text-ink/70">Online payments are confirmed only by verifying with Paynow server-to-server.</p>
                <button className="w-full rounded-full border border-forest py-3 text-xs font-semibold uppercase tracking-[0.14em] text-forest hover:bg-forest hover:text-warm">Re-check with Paynow</button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
