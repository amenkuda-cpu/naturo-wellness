import "server-only";
import { formatMoney } from "@/lib/commerce/pricing";
import { sendEmail } from "@/lib/email";
import type { OrderRecord } from "@/lib/orders/types";
import { whatsappDigits } from "@/lib/phone";

/**
 * "New order" alert to the Naturo team's WhatsApp, sent the moment an order is
 * placed. Two ways to deliver, chosen by which secrets are set:
 *
 * 1. WhatsApp Cloud API (Meta, official):
 *    WHATSAPP_CLOUD_TOKEN, WHATSAPP_CLOUD_PHONE_ID, ORDER_ALERT_WHATSAPP
 *    and optionally ORDER_ALERT_TEMPLATE (an approved template with one body
 *    variable; needed unless the team number messaged the sender in the last 24 h).
 * 2. CallMeBot (free relay for alerts to your own number):
 *    CALLMEBOT_APIKEY, ORDER_ALERT_WHATSAPP.
 *
 * ORDER_ALERT_EMAIL additionally emails the same alert when email is set up.
 * Never throws: a failed alert must never fail a customer's order.
 */

const METHOD: Record<OrderRecord["paymentMethod"], string> = {
  pesepay: "Pesepay (online)",
  paynow: "Paynow (online)",
  cash_on_delivery: "Pay on delivery/collection",
  manual: "Mobile money / bank transfer",
};

const env = () => ({
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://getnaturo.com").replace(/\/+$/, ""),
  to: (process.env.ORDER_ALERT_WHATSAPP || "").replace(/\D/g, ""),
  cloudToken: (process.env.WHATSAPP_CLOUD_TOKEN || "").trim(),
  cloudPhoneId: (process.env.WHATSAPP_CLOUD_PHONE_ID || "").trim(),
  template: (process.env.ORDER_ALERT_TEMPLATE || "").trim(),
  templateLang: (process.env.ORDER_ALERT_TEMPLATE_LANG || "en").trim(),
  callmebotKey: (process.env.CALLMEBOT_APIKEY || "").trim(),
  email: (process.env.ORDER_ALERT_EMAIL || "").trim(),
});

export function orderAlertConfigured() {
  const e = env();
  return Boolean(e.to && ((e.cloudToken && e.cloudPhoneId) || e.callmebotKey));
}

/** Plain text that reads well in WhatsApp (bold with *asterisks*). */
export function buildOrderAlert(order: OrderRecord, opts: { siteUrl: string }) {
  const money = (v: number) => formatMoney(v, order.currency);
  const wa = whatsappDigits(order.customer.phone, order.fulfilment.zoneId);
  const onWhatsApp = !/\[Not on WhatsApp\]/.test(order.notes);
  const where =
    order.fulfilment.method === "delivery" && order.fulfilment.address
      ? `🚚 Delivery · ${order.fulfilment.zoneName ?? "delivery"}\n${[order.fulfilment.address.line1, order.fulfilment.address.suburb, order.fulfilment.address.city].filter(Boolean).join(", ")}${order.fulfilment.address.instructions ? `\nNote: ${order.fulfilment.address.instructions}` : ""}`
      : "🏪 Collection from Naturo";
  const customerNotes = order.notes.replace(/\[[^\]]*\]\n?/g, "").trim();
  return [
    `🛒 *New Naturo order ${order.orderNumber}*`,
    `*${money(order.total)}* · ${METHOD[order.paymentMethod]}`,
    ``,
    ...order.lines.map((l) => `• ${l.quantity} × ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} — ${money(l.lineTotal)}`),
    ...(order.discount > 0 ? [`Discount: -${money(order.discount)}${order.promoCode ? ` (${order.promoCode})` : ""}`] : []),
    ...(order.deliveryFee > 0 ? [`Delivery fee: ${money(order.deliveryFee)}`] : []),
    ``,
    `👤 ${order.customer.fullName}`,
    `📱 ${order.customer.phone}${onWhatsApp ? ` · WhatsApp: https://wa.me/${wa}` : " (not on WhatsApp)"}`,
    ...(order.customer.email ? [`✉️ ${order.customer.email}`] : []),
    where,
    ...(customerNotes ? [``, `📝 ${customerNotes}`] : []),
    ``,
    `Open in admin: ${opts.siteUrl}/admin/orders/${order.id}`,
  ].join("\n");
}

async function viaCloudApi(text: string, e: ReturnType<typeof env>) {
  const message = e.template
    ? {
        type: "template",
        template: {
          name: e.template,
          language: { code: e.templateLang },
          // Template body variables can't contain newlines or long runs of spaces.
          components: [{ type: "body", parameters: [{ type: "text", text: text.replace(/\n+/g, " · ").replace(/\s{4,}/g, " ").slice(0, 1000) }] }],
        },
      }
    : { type: "text", text: { preview_url: false, body: text.slice(0, 4096) } };
  const res = await fetch(`https://graph.facebook.com/v21.0/${e.cloudPhoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${e.cloudToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: e.to, ...message }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message || `WhatsApp Cloud API ${res.status}`);
}

async function viaCallMeBot(text: string, e: ReturnType<typeof env>) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent("+" + e.to)}&text=${encodeURIComponent(text.slice(0, 1500))}&apikey=${encodeURIComponent(e.callmebotKey)}`;
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.text().catch(() => "");
  if (!res.ok || /error|invalid|not allowed/i.test(body.slice(0, 400))) throw new Error(`CallMeBot: ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) || res.status}`);
}

/** Sends the alert; returns a short outcome for the order timeline. */
export async function sendOrderAlert(order: OrderRecord): Promise<{ ok: boolean; note: string }> {
  const e = env();
  const text = buildOrderAlert(order, { siteUrl: e.siteUrl });
  const outcomes: string[] = [];
  let ok = false;
  try {
    if (e.to && e.cloudToken && e.cloudPhoneId) {
      await viaCloudApi(text, e);
      ok = true;
      outcomes.push("Team alerted on WhatsApp");
    } else if (e.to && e.callmebotKey) {
      await viaCallMeBot(text, e);
      ok = true;
      outcomes.push("Team alerted on WhatsApp");
    }
  } catch (err) {
    outcomes.push(`WhatsApp alert failed: ${(err as Error).message}`.slice(0, 200));
  }
  if (e.email) {
    const sent = await sendEmail({ from: "noreply", to: e.email, subject: `New order ${order.orderNumber} · ${formatMoney(order.total, order.currency)}`, text }).catch(
      (err: Error) => ({ ok: false as const, error: err.message }),
    );
    if (sent.ok) {
      ok = true;
      outcomes.push("Team alerted by email");
    }
  }
  return { ok, note: outcomes.join(" · ") || "No team alert channel set up" };
}
