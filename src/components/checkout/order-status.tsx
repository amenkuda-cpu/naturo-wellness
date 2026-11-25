"use client";

import { Check, Clock, Loader2, MessageCircle, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LiveMap } from "@/components/tracking/live-map";
import { metaPixel } from "@/config/meta";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/commerce/pricing";
import { markPurchaseSent, purchaseAlreadySent, purchaseBridgeUrl } from "@/lib/meta-pixel";
import type { PublicOrder } from "@/lib/orders/types";
import { isOnlinePayment, type OrderStatus, type PaymentStatus } from "@/lib/types";

const PAYMENT_COPY: Record<PaymentStatus, { label: string; tone: string }> = {
  unpaid: { label: "Pay on delivery / collection", tone: "bg-cream text-forest" },
  pending: { label: "Awaiting payment confirmation", tone: "bg-citrus text-forest" },
  paid: { label: "Paid", tone: "bg-leaf/25 text-forest" },
  failed: { label: "Payment not completed", tone: "bg-hibiscus/10 text-hibiscus" },
  refunded: { label: "Refunded", tone: "bg-cream text-forest" },
  cancelled: { label: "Payment cancelled", tone: "bg-hibiscus/10 text-hibiscus" },
};

const STEPS: { id: OrderStatus; label: string }[] = [
  { id: "pending", label: "Order placed" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "out_for_delivery", label: "On its way" },
  { id: "completed", label: "Completed" },
];

const naturoWhatsApp = (siteConfig.contact.whatsapp ?? "").replace(/\D/g, "");

/** Pre-written WhatsApp message: everything the team needs to confirm the order. */
function whatsAppOrderText(order: PublicOrder, money: (v: number) => string) {
  const where =
    order.fulfilment.method === "delivery" && order.fulfilment.address
      ? `Delivery to ${[order.fulfilment.address.line1, order.fulfilment.address.suburb, order.fulfilment.address.city].filter(Boolean).join(", ")}`
      : "Collection";
  return [
    `Hi Naturo! I've just placed order ${order.orderNumber} (${money(order.total)}).`,
    ...order.lines.map((l) => `- ${l.quantity} x ${l.name}`),
    where,
    `Name: ${order.customer.fullName}`,
  ].join("\n");
}

function stepIndex(status: OrderStatus) {
  if (status === "ready_for_collection") return 3;
  return STEPS.findIndex((s) => s.id === status);
}

export function OrderStatusView({
  initial,
  token,
  manualInstructions,
}: {
  initial: PublicOrder;
  token: string;
  manualInstructions: string | null;
}) {
  const [order, setOrder] = useState(initial);
  const [checking, setChecking] = useState(false);
  const online = isOnlinePayment(order.paymentMethod);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${order.id}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        if (data.order.paymentStatus === "failed") track("payment_failed", { order_number: data.order.orderNumber });
      }
    } finally {
      setChecking(false);
    }
  }, [order.id, token]);

  // Poll briefly while an online payment is being confirmed by the provider.
  useEffect(() => {
    if (!online || order.paymentStatus !== "pending") return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (n > 24) window.clearInterval(id);
      else void refresh();
    }, 5000);
    return () => window.clearInterval(id);
  }, [online, order.paymentStatus, refresh]);

  // Keep the page fresh while the order moves (confirmed → on the road → delivered).
  useEffect(() => {
    if (["completed", "cancelled"].includes(order.status)) return;
    const id = window.setInterval(() => document.visibilityState === "visible" && void refresh(), 20000);
    return () => window.clearInterval(id);
  }, [order.status, refresh]);

  // Meta Purchase: once per order, only when the order truly succeeded (offline
  // methods: placed; online: provider-confirmed paid). Sent from a clean bridge
  // page in a no-referrer iframe so this page's private link never reaches Meta.
  useEffect(() => {
    if (!metaPixel.enabled || order.status === "cancelled") return;
    if (online ? order.paymentStatus !== "paid" : order.paymentStatus === "failed") return;
    if (Date.now() - Date.parse(order.createdAt) > 3 * 24 * 60 * 60 * 1000) return;
    if (purchaseAlreadySent(order.id)) return;
    markPurchaseSent(order.id);
    const frame = document.createElement("iframe");
    frame.src = purchaseBridgeUrl(order);
    frame.referrerPolicy = "no-referrer";
    frame.title = "";
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
    document.body.appendChild(frame);
    window.setTimeout(() => frame.remove(), 30_000);
  }, [order, online]);

  const cancelled = order.status === "cancelled";
  const onTheWay = order.fulfilment.method === "delivery" && order.status === "out_for_delivery";
  const current = stepIndex(order.status);
  const pay = PAYMENT_COPY[order.paymentStatus];
  const money = (v: number) => formatMoney(v, order.currency);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="space-y-8 lg:col-span-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("rounded-full px-4 py-1.5 text-sm font-semibold", pay.tone)}>{pay.label}</span>
          {online && order.paymentStatus === "pending" && (
            <button
              type="button"
              onClick={refresh}
              disabled={checking}
              className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-4 py-1.5 text-sm font-medium hover:bg-forest/5"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              Check payment status
            </button>
          )}
        </div>

        {order.paymentMethod === "manual" && order.paymentStatus === "pending" && manualInstructions && (
          <div className="rounded-2xl border border-sun bg-citrus/40 p-5">
            <p className="font-semibold text-forest">How to pay</p>
            <p className="mt-1 whitespace-pre-line text-ink/80">{manualInstructions}</p>
            <p className="mt-2 text-sm text-ink/70">
              Use <strong>{order.orderNumber}</strong> as your payment reference. We confirm your order once payment is verified.
            </p>
          </div>
        )}
        {order.paymentStatus === "failed" && (
          <div className="flex items-start gap-3 rounded-2xl bg-hibiscus/10 p-5 text-hibiscus">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>Your payment wasn&apos;t completed. Your order is saved. Please contact us and quote {order.orderNumber} so we can help.</p>
          </div>
        )}

        {!cancelled && naturoWhatsApp && (
          <div className="rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 p-5">
            <p className="font-semibold text-forest">Get your order confirmed faster</p>
            <p className="mt-1 text-sm text-ink/75">
              Send your order to us on WhatsApp with one tap. The message is already written for you.
            </p>
            <a
              href={`https://wa.me/${naturoWhatsApp}?text=${encodeURIComponent(whatsAppOrderText(order, money))}`}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#0b3d20] shadow-sm transition hover:brightness-105"
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> Send my order to Naturo on WhatsApp
            </a>
          </div>
        )}

        <section aria-labelledby="progress-title">
          <h2 id="progress-title" className="eyebrow text-ink/70">Order progress</h2>
          {cancelled ? (
            <p className="mt-4 font-semibold text-hibiscus">This order has been cancelled.</p>
          ) : (
            <ol className="mt-5 grid gap-3 sm:grid-cols-5">
              {STEPS.map((s, i) => {
                const done = i <= current;
                return (
                  <li key={s.id} className="flex items-center gap-3 sm:flex-col sm:items-start" aria-current={i === current ? "step" : undefined}>
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2",
                        done ? "border-forest bg-forest text-warm" : "border-forest/20 text-forest/40",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden /> : <Clock className="h-4 w-4" aria-hidden />}
                    </span>
                    <span className={cn("text-sm font-medium", done ? "text-forest" : "text-ink/70")}>
                      {s.id === "out_for_delivery" && order.fulfilment.method === "collection" ? "Ready to collect" : s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {onTheWay && (
          <section aria-labelledby="live-title">
            <h2 id="live-title" className="eyebrow text-ink/70">Your delivery, live</h2>
            <p className="mt-2 text-sm text-ink/70">Your rider is on the way. The map updates by itself.</p>
            <LiveMap endpoint={`/api/tracking/${order.id}?t=${encodeURIComponent(token)}`} height={320} pollMs={8000} className="mt-4" />
          </section>
        )}

        <section aria-labelledby="details-title" className="grid gap-6 rounded-[2rem] bg-cream p-6 sm:grid-cols-2 sm:p-8">
          <h2 id="details-title" className="sr-only">Order details</h2>
          <div>
            <p className="eyebrow text-ink/70">Contact</p>
            <p className="mt-2 font-medium">{order.customer.fullName}</p>
            <p className="text-ink/70">{order.customer.phone}</p>
            {order.customer.email && <p className="text-ink/70">{order.customer.email}</p>}
          </div>
          <div>
            <p className="eyebrow text-ink/70">{order.fulfilment.method === "delivery" ? "Delivery" : "Collection"}</p>
            {order.fulfilment.address ? (
              <p className="mt-2 text-ink/80">
                {order.fulfilment.address.line1}
                <br />
                {order.fulfilment.address.suburb}, {order.fulfilment.address.city}
                {order.fulfilment.zoneName && <span className="block text-sm text-ink/70">{order.fulfilment.zoneName}</span>}
              </p>
            ) : (
              <p className="mt-2 text-ink/80">Collect at {siteConfig.contact.address}. Mon–Fri 08:00–17:00, Sat 09:00–13:00. We&apos;ll WhatsApp you when it&apos;s ready.</p>
            )}
          </div>
        </section>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-[2rem] border border-forest/10 p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold uppercase text-forest">Items</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {order.lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-4">
                <span>
                  {l.quantity} × {l.name}
                  <span className="block text-xs text-ink/70">{l.variantLabel}</span>
                </span>
                <span className="tabular-nums">{money(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-1.5 border-t border-forest/10 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-botanical"><dt>Discount</dt><dd>−{money(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{order.deliveryFee ? money(order.deliveryFee) : "Free"}</dd></div>
            {order.tax > 0 && <div className="flex justify-between text-ink/70"><dt>Tax</dt><dd>{money(order.tax)}</dd></div>}
            <div className="flex justify-between border-t border-forest/10 pt-3 font-display text-lg font-bold text-forest"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
