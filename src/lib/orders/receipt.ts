import "server-only";
import { z } from "zod";
import { formatMoney } from "@/lib/commerce/pricing";
import { sendEmail, type EmailResult } from "@/lib/email";
import { env } from "@/lib/env";
import { getSystemOps } from "@/lib/ops/repository";
import type { OrderRecord } from "./types";

/**
 * Payment receipt, emailed from billing@ the moment an order becomes paid
 * (provider-verified online payment, or staff confirming cash / transfer).
 * Callers pass only orders whose update reported `becamePaid`, so each order
 * gets one automatic receipt; staff can resend from the order page.
 */

const METHOD_LABEL: Record<OrderRecord["paymentMethod"], string> = {
  pesepay: "Pesepay (online)",
  paynow: "Paynow (online)",
  cash_on_delivery: "Cash on delivery / collection",
  manual: "Mobile money / bank transfer",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function paidAt(order: OrderRecord): Date {
  const entry = [...order.history].reverse().find((h) => h.paymentStatus === "paid");
  return new Date(entry?.at ?? Date.now());
}

function dateLabel(d: Date) {
  return new Intl.DateTimeFormat("en-ZW", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Harare" }).format(d);
}

export function buildReceipt(order: OrderRecord) {
  const money = (v: number) => formatMoney(v, order.currency);
  const when = dateLabel(paidAt(order));
  const firstName = order.customer.fullName.split(/\s+/)[0] || order.customer.fullName;
  const fulfil =
    order.fulfilment.method === "delivery" && order.fulfilment.address
      ? `Delivery to ${[order.fulfilment.address.line1, order.fulfilment.address.suburb, order.fulfilment.address.city].filter(Boolean).join(", ")}`
      : "Collection from Naturo";
  const totals: Array<[string, number, boolean?]> = [
    ["Subtotal", order.subtotal],
    ...(order.discount > 0 ? ([[`Discount${order.promoCode ? ` (${order.promoCode})` : ""}`, -order.discount]] as Array<[string, number]>) : []),
    [order.fulfilment.method === "delivery" ? `Delivery${order.fulfilment.zoneName ? ` (${order.fulfilment.zoneName})` : ""}` : "Collection", order.deliveryFee],
    ...(order.tax > 0 ? ([["Tax", order.tax]] as Array<[string, number]>) : []),
    ["Total paid", order.total, true],
  ];

  const subject = `Your Naturo receipt · Order ${order.orderNumber}`;

  const text = [
    `Hi ${firstName},`,
    ``,
    `Thank you! We've received your payment. This is your receipt.`,
    ``,
    `Order: ${order.orderNumber}`,
    `Paid: ${when}`,
    `Payment: ${METHOD_LABEL[order.paymentMethod]}${order.paymentReference ? ` (ref ${order.paymentReference})` : ""}`,
    ``,
    ...order.lines.map((l) => `${l.quantity} × ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""}  ${money(l.lineTotal)}`),
    ``,
    ...totals.map(([label, v]) => `${label}: ${v < 0 ? `-${money(-v)}` : money(v)}`),
    ``,
    fulfil,
    ``,
    `Questions about this payment? Reply to this email or write to ${env.email.supportAddress}.`,
    ``,
    `Naturo Wellness · Feel good. Naturally.`,
    `getnaturo.com`,
  ].join("\n");

  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;color:${strong ? "#173f2b" : "#5e6b60"};font-size:${strong ? "16px" : "14px"};${strong ? "font-weight:bold;" : ""}">${esc(label)}</td>` +
    `<td align="right" style="padding:6px 0;color:#173f2b;font-size:${strong ? "18px" : "14px"};${strong ? "font-weight:bold;" : ""}white-space:nowrap">${esc(value)}</td></tr>`;

  const items = order.lines
    .map(
      (l) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eadfc4;font-size:14px;color:#183126">` +
        `<strong>${esc(l.name)}</strong>${l.variantLabel ? `<br><span style="color:#5e6b60;font-size:12px">${esc(l.variantLabel)}</span>` : ""}` +
        `<br><span style="color:#5e6b60;font-size:12px">${l.quantity} × ${esc(money(l.unitPrice))}</span></td>` +
        `<td align="right" style="padding:10px 0;border-bottom:1px solid #eadfc4;font-size:14px;color:#183126;white-space:nowrap">${esc(money(l.lineTotal))}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#f5f0df;font-family:Arial,Helvetica,sans-serif;color:#183126">
<div style="display:none;max-height:0;overflow:hidden">Payment received for order ${esc(order.orderNumber)}: ${esc(money(order.total))}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf5;border-radius:18px;overflow:hidden">
<tr><td style="background:#173f2b;padding:20px 24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="color:#fbea91;font-size:18px;font-weight:bold;letter-spacing:.5px">Naturo Wellness</td>
    <td align="right" style="color:#fffdf5;font-size:12px;letter-spacing:2px;text-transform:uppercase">Receipt</td>
  </tr></table>
</td></tr>
<tr><td style="padding:26px 24px 6px">
  <h1 style="margin:0 0 6px;font-size:22px;color:#173f2b">Payment received. Thank you, ${esc(firstName)}!</h1>
  <p style="margin:0;color:#5e6b60;font-size:14px;line-height:1.6">Here's your receipt. Keep it for your records.</p>
</td></tr>
<tr><td style="padding:16px 24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0df;border-radius:12px">
    <tr><td style="padding:14px 16px;font-size:13px;color:#5e6b60;line-height:1.7">
      <strong style="color:#173f2b">Order</strong> ${esc(order.orderNumber)}<br>
      <strong style="color:#173f2b">Paid</strong> ${esc(when)}<br>
      <strong style="color:#173f2b">Payment</strong> ${esc(METHOD_LABEL[order.paymentMethod])}${order.paymentReference ? ` · ref ${esc(order.paymentReference)}` : ""}<br>
      <strong style="color:#173f2b">Billed to</strong> ${esc(order.customer.fullName)}
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:4px 24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
    ${totals.map(([label, v, strong]) => row(label, v < 0 ? `-${money(-v)}` : money(v), strong)).join("")}
  </table>
</td></tr>
<tr><td style="padding:14px 24px 22px;font-size:13px;color:#5e6b60;line-height:1.6">
  ${esc(fulfil)}.<br><br>
  Questions about this payment? Just reply to this email or write to
  <a href="mailto:${esc(env.email.supportAddress)}" style="color:#367a45">${esc(env.email.supportAddress)}</a>.
</td></tr>
<tr><td style="padding:14px 24px;background:#f5f0df;font-size:12px;color:#5e6b60">Naturo Wellness · Feel good. Naturally. · <a href="https://getnaturo.com" style="color:#367a45">getnaturo.com</a></td></tr>
</table></td></tr></table></body></html>`;

  return { subject, text, html };
}

/** Emails the receipt and records it in the admin message log. Never throws. */
export async function sendReceipt(order: OrderRecord, sentBy = "system"): Promise<EmailResult | { ok: false; error: string; skipped: true }> {
  const to = order.customer.email?.trim();
  if (!to || !z.email().safeParse(to).success) return { ok: false, error: "No email address on this order.", skipped: true };
  const r = buildReceipt(order);
  const sent = await sendEmail({ from: "billing", to, toName: order.customer.fullName, subject: r.subject, text: r.text, html: r.html }).catch(
    (err: Error) => ({ ok: false as const, error: err.message }),
  );
  await getSystemOps()
    .addMessage({
      enquiryId: null,
      orderId: order.id,
      customerName: order.customer.fullName.slice(0, 100),
      toEmail: to,
      toPhone: null,
      channel: "email",
      subject: r.subject.slice(0, 200),
      body: r.text.slice(0, 4000),
      status: sent.ok ? "sent" : "failed",
      error: sent.ok ? null : sent.error,
      sentBy,
    })
    .catch(() => undefined);
  return sent;
}
