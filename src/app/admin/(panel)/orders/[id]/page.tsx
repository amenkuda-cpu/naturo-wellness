import { ArrowLeft, Banknote, Check, History, Mail, MessageCircle, MessageSquareText, Package, Phone, RefreshCw, Store, Trash2, Truck, UserRound } from "lucide-react";
import { MessageComposer } from "@/components/admin/message-composer";
import { env } from "@/lib/env";
import { ORDER_TEMPLATES, withOrder } from "@/lib/ops/templates";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeliveryPanel } from "@/components/admin/delivery-panel";
import { whatsappDigits } from "@/lib/phone";
import {
  AdminTitle,
  Card,
  CardTitle,
  DevModeBanner,
  IconChip,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABEL,
  PaymentPill,
  SetupNotice,
  StatusPill,
  btn,
  field,
  harareTime,
  tones,
} from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { orderCost } from "@/lib/ops/metrics";
import { getStaffOps } from "@/lib/ops/repository";
import { getStaffRepository } from "@/lib/repositories";
import { isOnlinePayment } from "@/lib/types";
import { deleteOrderAction, recheckPaymentAction, resendReceiptAction, updateOrderStatusAction, updatePaymentStatusAction } from "../../../actions";

const STATUSES = ["pending", "confirmed", "preparing", "ready_for_collection", "out_for_delivery", "completed", "cancelled"] as const;
const STEPS = ["pending", "confirmed", "preparing", "out_for_delivery", "completed"] as const;

// Staff data is always read per request.
export const instant = false;

export default async function AdminOrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ delete?: string }> }) {
  const ctx = await requireStaff();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const deleteNotice =
    query.delete === "mismatch" ? "That didn't match the order number, so nothing was deleted." : query.delete === "paid" ? "Paid orders can't be deleted." : null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);
  const [order, opsReady] = await Promise.all([repo.getOrder(id), ops.ready()]);
  if (!order) notFound();
  const [delivery, costs, messages] = await Promise.all([
    ops.getDelivery(order.id).catch(() => null),
    ops.listVariantCosts().catch((): Record<string, number | null> => ({})),
    ops.listMessages({ orderId: order.id }).catch(() => []),
  ]);
  const money = (v: number) => formatMoney(v, order.currency);
  const online = isOnlinePayment(order.paymentMethod);
  const { cogs, uncosted } = orderCost(order, costs);
  const profit = order.total - cogs;
  const a = order.fulfilment.address;
  const address = a ? [a.line1, a.suburb, a.city].filter(Boolean).join(", ") : "";
  const phone = order.customer.phone.replace(/\s/g, "");
  const wa = whatsappDigits(order.customer.phone, order.fulfilment.zoneId);
  const collection = order.fulfilment.method === "collection";
  const stepIdx = order.status === "ready_for_collection" ? 3 : STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--a-muted)] hover:text-[var(--a-ink)]">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All orders
      </Link>
      <AdminTitle title={order.orderNumber} subtitle={`Placed ${harareTime(order.createdAt)} · ${PAYMENT_METHOD_LABEL[order.paymentMethod]}`}>
        <div className="flex gap-2"><StatusPill status={order.status} /><PaymentPill status={order.paymentStatus} /></div>
      </AdminTitle>

      {/* Progress */}
      {order.status !== "cancelled" && (
        <Card className="mb-5">
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => {
              const done = i <= stepIdx;
              const t = tones[ORDER_STATUS_META[s].tone];
              return (
                <li key={s} className="flex flex-col items-center gap-2 text-center" aria-current={i === stepIdx ? "step" : undefined}>
                  <span className="relative flex w-full items-center justify-center">
                    {i > 0 && <span className="absolute right-1/2 top-1/2 h-1 w-full -translate-y-1/2 rounded-full" style={{ backgroundColor: i <= stepIdx ? t.base : "var(--a-inset)" }} aria-hidden />}
                    <span className="relative grid h-10 w-10 place-items-center rounded-full border-4 border-white shadow" style={{ backgroundColor: done ? t.base : "var(--a-inset)", color: done ? "#fff" : "var(--a-muted)" }}>
                      {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </span>
                  </span>
                  <span className={done ? "text-xs font-bold text-[var(--a-ink)] sm:text-sm" : "text-xs text-[var(--a-muted)] sm:text-sm"}>
                    {s === "out_for_delivery" && collection ? "Ready" : ORDER_STATUS_META[s].label}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {!collection && (
            <Card>
              <CardTitle icon={Truck} tone="ember">Delivery &amp; live tracking</CardTitle>
              {opsReady ? (
                <DeliveryPanel
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  address={address}
                  riderName={delivery?.riderName ?? null}
                  riderPhone={delivery?.riderPhone ?? null}
                  hasDest={Boolean(delivery?.dest)}
                  started={Boolean(delivery?.startedAt)}
                  delivered={Boolean(delivery?.deliveredAt) || order.status === "completed"}
                />
              ) : (
                <SetupNotice title="Live tracking needs one database step">Apply the admin_ops migration to turn on rider links and the live map.</SetupNotice>
              )}
            </Card>
          )}

          <Card>
            <CardTitle icon={MessageSquareText} tone="sky">Message {order.customer.fullName.split(" ")[0]}</CardTitle>
            <MessageComposer
              to={{ name: order.customer.fullName, email: order.customer.email, phone: order.customer.phone }}
              orderId={order.id}
              templates={withOrder(ORDER_TEMPLATES, order.orderNumber)}
              history={messages}
              emailReady={env.email.configured || !env.isProduction}
              defaultSubject={`Your Naturo order ${order.orderNumber}`}
            />
          </Card>

          <Card>
            <CardTitle icon={Package} tone="sun">Items</CardTitle>
            <table className="w-full text-sm">
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.variantId} className="border-b border-[var(--a-line)]">
                    <td className="py-2.5"><span className="font-semibold text-[var(--a-ink)]">{l.quantity} × {l.name}</span><span className="block text-xs text-[var(--a-muted)]">{l.variantLabel} · {money(l.unitPrice)} each</span></td>
                    <td className="py-2.5 text-right tabular-nums">{money(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-[var(--a-muted)]">
                <tr><td className="pt-3">Subtotal</td><td className="pt-3 text-right tabular-nums">{money(order.subtotal)}</td></tr>
                {order.discount > 0 && <tr><td>Discount {order.promoCode && `(${order.promoCode})`}</td><td className="text-right tabular-nums">−{money(order.discount)}</td></tr>}
                <tr><td>Delivery</td><td className="text-right tabular-nums">{money(order.deliveryFee)}</td></tr>
                {order.tax > 0 && <tr><td>Tax</td><td className="text-right tabular-nums">{money(order.tax)}</td></tr>}
                <tr className="text-base font-extrabold text-[var(--a-ink)]"><td className="pt-2">Total</td><td className="pt-2 text-right tabular-nums">{money(order.total)}</td></tr>
                <tr><td className="pt-3">Cost of goods</td><td className="pt-3 text-right tabular-nums">{uncosted ? "Costs not entered" : money(cogs)}</td></tr>
                <tr className="font-bold" style={{ color: tones.violet.ink }}><td>Profit on this order</td><td className="text-right tabular-nums">{uncosted ? "–" : money(profit)}</td></tr>
              </tfoot>
            </table>
            {uncosted > 0 && <p className="mt-2 text-xs text-[var(--a-muted)]">Add unit costs in <Link href="/admin/finance#costs" className="font-semibold underline">Profit</Link> to see profit per order.</p>}
          </Card>

          <Card>
            <CardTitle icon={History} tone="teal">History</CardTitle>
            <ol className="relative space-y-3 text-sm">
              <span className="absolute bottom-2 left-[5px] top-2 w-px bg-[var(--a-inset)]" aria-hidden />
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="relative flex gap-3 pl-0">
                  <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-[var(--a-card)]" style={{ backgroundColor: h.status ? tones[ORDER_STATUS_META[h.status].tone].base : h.paymentStatus === "paid" ? tones.green.base : "var(--a-muted)" }} />
                  <span>
                    <span className="font-semibold text-[var(--a-ink)]">{h.note}</span>
                    <span className="block text-xs text-[var(--a-muted)]">{harareTime(h.at)} · {h.actor}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle icon={UserRound} tone="sky">Customer</CardTitle>
            <p className="text-lg font-bold text-[var(--a-ink)]">{order.customer.fullName}</p>
            <p className="text-sm text-[var(--a-muted)]">{order.customer.phone}{order.customer.email && ` · ${order.customer.email}`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${phone}`} className={btn.secondary}><Phone className="h-4 w-4" aria-hidden /> Call</a>
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${order.customer.fullName.split(" ")[0]}, this is Naturo Wellness about your order ${order.orderNumber}.`)}`} target="_blank" rel="noopener" className={btn.secondary}>
                <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
              </a>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-[16px] bg-[var(--a-inset)] p-3 text-sm">
              <IconChip icon={collection ? Store : Truck} tone={collection ? "teal" : "ember"} size="sm" />
              <span>
                <span className="font-semibold text-[var(--a-ink)]">{collection ? "Collection" : `Delivery${order.fulfilment.zoneName ? ` · ${order.fulfilment.zoneName}` : ""}`}</span>
                {a && <span className="block text-[var(--a-muted)]">{address}</span>}
                {a?.instructions && <span className="block italic text-[var(--a-muted)]">“{a.instructions}”</span>}
              </span>
            </div>
            {order.notes && <p className="mt-3 rounded-[16px] bg-[var(--c-warn-bg)] p-3 text-sm text-[var(--c-warn)]">Note: {order.notes}</p>}
          </Card>

          <Card>
            <CardTitle icon={Check} tone="green">Update status</CardTitle>
            <form action={updateOrderStatusAction} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="block text-sm">
                <span className="sr-only">Order status</span>
                <select name="status" defaultValue={order.status} className={field}>
                  {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--a-muted)]">Internal note (optional)</span>
                <input name="note" maxLength={300} className={field} />
              </label>
              <button className={`${btn.primary} w-full`}>Save status</button>
            </form>
          </Card>

          <Card>
            <CardTitle icon={Banknote} tone="violet">Payment</CardTitle>
            <p className="text-sm text-[var(--a-muted)]">{PAYMENT_METHOD_LABEL[order.paymentMethod]}{order.paymentReference && ` · Ref ${order.paymentReference}`}</p>
            {!online ? (
              <form action={updatePaymentStatusAction} className="mt-3 space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <select name="paymentStatus" defaultValue={order.paymentStatus} className={field} aria-label="Payment status">
                  {(["unpaid", "pending", "paid", "refunded", "cancelled"] as const).map((s) => <option key={s} value={s}>{s === "unpaid" ? "Not paid yet" : s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
                <p className="text-xs text-[var(--a-muted)]">Only mark as paid once you have seen the money arrive.</p>
                <button className={`${btn.secondary} w-full`}>Save payment</button>
              </form>
            ) : (
              <form action={recheckPaymentAction} className="mt-3 space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <p className="text-xs text-[var(--a-muted)]">Online payments are confirmed only by {PAYMENT_METHOD_LABEL[order.paymentMethod]} itself, server to server.</p>
                <button className={`${btn.secondary} w-full`}><RefreshCw className="h-4 w-4" aria-hidden /> Check with {PAYMENT_METHOD_LABEL[order.paymentMethod]}</button>
              </form>
            )}
            {order.paymentStatus === "paid" && (
              <form action={resendReceiptAction} className="mt-3 border-t border-[var(--a-line)] pt-3">
                <input type="hidden" name="orderId" value={order.id} />
                {order.customer.email ? (
                  <>
                    <p className="text-xs text-[var(--a-muted)]">A receipt goes to {order.customer.email} automatically from billing@getnaturo.com when payment is confirmed.</p>
                    <button className={`${btn.secondary} mt-2 w-full`}><Mail className="h-4 w-4" aria-hidden /> Resend receipt</button>
                  </>
                ) : (
                  <p className="text-xs text-[var(--a-muted)]">No receipt email: the customer didn&apos;t give an email address.</p>
                )}
              </form>
            )}
          </Card>

          {ctx.role === "admin" && (
            <details className="rounded-[22px] border border-[var(--c-bad)]/40 bg-[var(--c-bad-bg)] p-4 text-sm">
              <summary className="flex cursor-pointer items-center gap-2 font-semibold text-[var(--c-bad)]">
                <Trash2 className="h-4 w-4" aria-hidden /> Delete this order
              </summary>
              {order.paymentStatus === "paid" ? (
                <p className="mt-3 text-[var(--a-muted)]">This order is paid, so it can&apos;t be deleted. Mark the payment as refunded or cancelled first.</p>
              ) : (
                <form action={deleteOrderAction} className="mt-3 space-y-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <p className="text-[var(--a-muted)]">
                    For failed payments, test or duplicate orders. This permanently removes the order, its items and history.
                    {order.status === "completed" || order.status === "out_for_delivery" ? " Stock is not put back because the goods have left." : " Any tracked stock goes back on the shelf."}
                  </p>
                  {deleteNotice && <p className="font-semibold text-[var(--c-bad)]">{deleteNotice}</p>}
                  <label className="block">
                    <span className="mb-1 block text-[var(--a-muted)]">Type <b className="text-[var(--a-ink)]">{order.orderNumber}</b> to confirm</span>
                    <input name="confirm" required autoComplete="off" className={field} />
                  </label>
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--c-bad)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete order permanently
                  </button>
                </form>
              )}
            </details>
          )}
        </div>
      </div>
    </>
  );
}
