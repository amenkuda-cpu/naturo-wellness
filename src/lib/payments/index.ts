import "server-only";
import { env } from "@/lib/env";
import type { OrderRecord } from "@/lib/orders/types";
import type { PaymentMethodId, PaymentStatus } from "@/lib/types";
import {
  PAYNOW_INITIATE_URL,
  amountMatches,
  buildInitiateBody,
  getField,
  mapPaynowStatus,
  parsePaynowMessage,
  verifyPaynowHash,
} from "./paynow-protocol";

/**
 * Modular payment providers. Add a provider by implementing PaymentProvider
 * and registering it in `providers` below; the checkout picks it up from
 * `enabledPaymentMethods()` automatically.
 */

export type PaymentInitiation =
  | { kind: "redirect"; url: string; reference: string | null; providerData: Record<string, string> }
  | { kind: "instructions"; instructions: string }
  | { kind: "none" };

export interface PaymentMethodInfo {
  id: PaymentMethodId;
  label: string;
  description: string;
}

interface PaymentProvider extends PaymentMethodInfo {
  enabled: () => boolean;
  /** Payment status an order starts with when using this method. */
  initialStatus: PaymentStatus;
  initiate(order: OrderRecord, ctx: { returnUrl: string }): Promise<PaymentInitiation>;
}

const cashOnDelivery: PaymentProvider = {
  id: "cash_on_delivery",
  label: "Pay on delivery or collection",
  description: "Pay when you receive your order. Our team confirms every order first.",
  enabled: () => env.payments.cashOnDelivery,
  initialStatus: "unpaid",
  initiate: async () => ({ kind: "none" }),
};

const manual: PaymentProvider = {
  id: "manual",
  label: "Mobile money / bank transfer",
  description: "We'll send payment details. Your order is confirmed once our team verifies payment.",
  enabled: () => env.payments.manual,
  initialStatus: "pending",
  initiate: async () => ({ kind: "instructions", instructions: env.payments.manualInstructions }),
};

const paynow: PaymentProvider = {
  id: "paynow",
  label: "Paynow: EcoCash, OneMoney, InnBucks, Visa & Mastercard",
  description: "You'll be taken to Paynow's secure checkout to pay.",
  enabled: () => env.payments.paynow.enabled,
  initialStatus: "pending",
  async initiate(order, ctx) {
    const { integrationId, integrationKey, authEmail } = env.payments.paynow;
    const body = buildInitiateBody({
      integrationId,
      integrationKey,
      reference: order.orderNumber,
      amountMinor: order.total,
      additionalInfo: `Naturo order ${order.orderNumber}`,
      returnUrl: ctx.returnUrl,
      resultUrl: `${env.siteUrl}/api/payments/paynow/result`,
      authEmail: order.customer.email ?? (authEmail || undefined),
    });
    const res = await fetch(PAYNOW_INITIATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const values = parsePaynowMessage(await res.text());
    const status = getField(values, "status");
    if (!res.ok || status?.toLowerCase() !== "ok") {
      throw new Error(`Paynow initiation failed: ${getField(values, "error") ?? res.status}`);
    }
    if (!verifyPaynowHash(values, integrationKey)) throw new Error("Paynow response hash mismatch.");
    const browserUrl = getField(values, "browserurl");
    const pollUrl = getField(values, "pollurl");
    if (!browserUrl || !pollUrl) throw new Error("Paynow response missing URLs.");
    return { kind: "redirect", url: browserUrl, reference: null, providerData: { provider: "paynow", pollUrl } };
  },
};

const providers: PaymentProvider[] = [paynow, manual, cashOnDelivery];

export function enabledPaymentMethods(): PaymentMethodInfo[] {
  return providers.filter((p) => p.enabled()).map(({ id, label, description }) => ({ id, label, description }));
}

export function getProvider(id: PaymentMethodId): PaymentProvider | null {
  const p = providers.find((x) => x.id === id);
  return p && p.enabled() ? p : null;
}

/**
 * Asks Paynow for the authoritative status of a transaction using the poll URL
 * WE stored at initiation (never a URL supplied by the caller), verifies the
 * hash and checks the amount. This is the only path that can mark an order paid.
 */
export async function verifyPaynowPayment(order: OrderRecord): Promise<{
  status: PaymentStatus;
  reference: string | null;
} | null> {
  const pollUrl = order.paymentData.pollUrl;
  if (!pollUrl || !env.payments.paynow.enabled) return null;
  if (!/^https:\/\/www\.paynow\.co\.zw\//i.test(pollUrl)) return null;
  const res = await fetch(pollUrl, { method: "POST", cache: "no-store" });
  const values = parsePaynowMessage(await res.text());
  if (!verifyPaynowHash(values, env.payments.paynow.integrationKey)) return null;
  if (getField(values, "reference") !== order.orderNumber) return null;
  const mapped = mapPaynowStatus(getField(values, "status"));
  if (mapped === "paid" && !amountMatches(getField(values, "amount"), order.total)) {
    return { status: "failed", reference: getField(values, "paynowreference") ?? null };
  }
  return { status: mapped, reference: getField(values, "paynowreference") ?? null };
}
