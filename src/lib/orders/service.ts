import "server-only";
import { commerceConfig } from "@/config/commerce";
import { buildQuote, type Quote } from "@/lib/commerce/pricing";
import type { CheckoutData } from "@/lib/commerce/validation";
import { env } from "@/lib/env";
import { getProvider, verifyPaynowPayment } from "@/lib/payments";
import { getRepository } from "@/lib/repositories";
import type { CartLine, DeliveryZone, FulfilmentMethod } from "@/lib/types";
import { OrderingUnavailableError, StockConflictError, type OrderRecord } from "./types";
import { generateAccessToken, generateOrderNumber, hashAccessToken } from "./token";

/** Authoritative server-side quote, built from freshly loaded data. */
export async function quoteCart(input: {
  items: CartLine[];
  fulfilment?: { method: FulfilmentMethod; zoneId?: string };
  promoCode?: string | null;
}): Promise<{ quote: Quote; zone: DeliveryZone | null; fulfilmentError: string | null }> {
  const repo = getRepository();
  const [catalog, zones, promotion] = await Promise.all([
    repo.loadCatalog(),
    repo.loadDeliveryZones(),
    input.promoCode ? repo.findPromotion(input.promoCode) : Promise.resolve(null),
  ]);

  let zone: DeliveryZone | null = null;
  let fulfilmentError: string | null = null;
  let deliveryFee: number | null = null;

  if (input.fulfilment?.method === "delivery") {
    zone = zones.find((z) => z.id === input.fulfilment!.zoneId && z.active && z.fee !== null) ?? null;
    if (input.fulfilment.zoneId && !zone) fulfilmentError = "We don't deliver to that area yet.";
    deliveryFee = zone?.fee ?? null;
  } else if (input.fulfilment?.method === "collection") {
    if (!commerceConfig.collection.enabled) fulfilmentError = "Collection isn't available right now.";
    deliveryFee = 0;
  }

  const quote = buildQuote({
    lines: input.items,
    catalog,
    deliveryFee,
    promotion,
    promoCode: input.promoCode,
    taxRateBps: commerceConfig.taxRateBps,
    pricesIncludeTax: commerceConfig.pricesIncludeTax,
    maxQuantityPerLine: commerceConfig.maxQuantityPerLine,
    currency: commerceConfig.currency,
  });
  return { quote, zone, fulfilmentError };
}

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      accessToken: string;
      next: { kind: "redirect"; url: string } | { kind: "confirmation"; url: string };
    }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string>; quote?: Quote };

export async function placeOrder(data: CheckoutData, customerId: string | null): Promise<PlaceOrderResult> {
  const repo = getRepository();
  if (!repo.canStoreOrders) return { ok: false, status: 503, error: new OrderingUnavailableError().message };

  const provider = getProvider(data.paymentMethod);
  if (!provider) {
    return { ok: false, status: 422, error: "That payment method isn't available.", fieldErrors: { paymentMethod: "Choose an available payment method." } };
  }

  const { quote, zone, fulfilmentError } = await quoteCart({
    items: data.items,
    fulfilment:
      data.fulfilment.method === "delivery"
        ? { method: "delivery", zoneId: data.fulfilment.zoneId }
        : { method: "collection" },
    promoCode: data.promoCode || null,
  });

  if (fulfilmentError || (data.fulfilment.method === "delivery" && !zone)) {
    return {
      ok: false,
      status: 422,
      error: fulfilmentError ?? "Choose a delivery area.",
      fieldErrors: { "fulfilment.zoneId": fulfilmentError ?? "Choose a delivery area." },
    };
  }
  if (quote.issues.length > 0 || quote.lines.length === 0) {
    return { ok: false, status: 409, error: "Some items in your cart need attention.", quote };
  }
  if (data.promoCode && quote.promotionError) {
    return { ok: false, status: 422, error: quote.promotionError, fieldErrors: { promoCode: quote.promotionError }, quote };
  }

  const accessToken = generateAccessToken();
  let order: OrderRecord;
  try {
    order = await repo.createOrder({
      orderNumber: generateOrderNumber(),
      status: "pending",
      paymentStatus: provider.initialStatus,
      paymentMethod: provider.id,
      paymentReference: null,
      paymentData: {},
      currency: quote.currency,
      customer: data.customer,
      customerId,
      fulfilment: {
        method: data.fulfilment.method,
        zoneId: zone?.id ?? null,
        zoneName: zone?.name ?? null,
        address: data.fulfilment.method === "delivery" ? data.fulfilment.address : null,
      },
      lines: quote.lines,
      subtotal: quote.subtotal,
      discount: quote.discount,
      deliveryFee: quote.deliveryFee,
      tax: quote.tax,
      total: quote.total,
      promoCode: quote.promotionCode,
      notes: data.notes,
      accessTokenHash: hashAccessToken(accessToken),
    });
  } catch (err) {
    if (err instanceof StockConflictError) return { ok: false, status: 409, error: err.message };
    if (err instanceof OrderingUnavailableError) return { ok: false, status: 503, error: err.message };
    throw err;
  }

  const confirmationUrl = `/order/${order.id}?t=${encodeURIComponent(accessToken)}`;
  try {
    const initiation = await provider.initiate(order, { returnUrl: `${env.siteUrl}${confirmationUrl}` });
    if (initiation.kind === "redirect") {
      await repo.updateOrder(
        order.id,
        { paymentData: initiation.providerData, paymentReference: initiation.reference, paymentStatus: "pending" },
        { note: `Payment started with ${provider.id}`, actor: "system" },
      );
      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        accessToken,
        next: { kind: "redirect", url: initiation.url },
      };
    }
  } catch (err) {
    console.error("[payments] initiation failed", err);
    await repo.updateOrder(order.id, { paymentStatus: "failed" }, { note: "Payment could not be started", actor: "system" });
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    accessToken,
    next: { kind: "confirmation", url: confirmationUrl },
  };
}

/** Re-checks a Paynow order's status with Paynow and records any change. */
export async function refreshPaymentStatus(order: OrderRecord): Promise<OrderRecord> {
  if (order.paymentMethod !== "paynow" || order.paymentStatus === "paid") return order;
  const result = await verifyPaynowPayment(order);
  if (!result || result.status === order.paymentStatus) return order;
  return getRepository().updateOrder(
    order.id,
    {
      paymentStatus: result.status,
      paymentReference: result.reference ?? order.paymentReference,
      ...(result.status === "paid" && order.status === "pending" ? { status: "confirmed" as const } : {}),
    },
    { note: `Paynow reported: ${result.status}`, actor: "paynow" },
  );
}
