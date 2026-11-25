import "server-only";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { commerceConfig } from "@/config/commerce";
import { categories } from "@/data/products";
import { buildQuote, type Quote } from "@/lib/commerce/pricing";
import type { CheckoutData } from "@/lib/commerce/validation";
import { env } from "@/lib/env";
import { getProvider, verifyOnlinePayment } from "@/lib/payments";
import { getRepository } from "@/lib/repositories";
import { sendReceipt } from "./receipt";
import { orderAlertConfigured, sendOrderAlert } from "@/lib/notify/order-alert";
import { isOnlinePayment, type CartLine, type DeliveryZone, type FulfilmentMethod } from "@/lib/types";
import { OrderingUnavailableError, StockConflictError, type OrderRecord } from "./types";
import { generateAccessToken, generateOrderNumber, hashAccessToken } from "./token";

/** Authoritative server-side quote, built from freshly loaded data. */
export async function quoteCart(input: {
  items: CartLine[];
  fulfilment?: { method: FulfilmentMethod; zoneId?: string };
  promoCode?: string | null;
}): Promise<{ quote: Quote; zone: DeliveryZone | null; fulfilmentError: string | null; ageRestricted: boolean; stockNearlyGone: boolean }> {
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
  const restrictedCategories = new Set(categories.filter((c) => c.ageRestricted).map((c) => c.id));
  const ageRestricted = input.items.some((line) => {
    const product = catalog.find((p) => p.id === line.productId);
    return product ? restrictedCategories.has(product.category) : false;
  });
  // Tracked stock that this cart would bring to "low" or "sold out": the cached shop pages must refresh.
  const stockNearlyGone = quote.lines.some((line) => {
    const variant = catalog.find((p) => p.id === line.productId)?.variants.find((v) => v.id === line.variantId);
    return variant?.stockQuantity != null && variant.stockQuantity - line.quantity <= LOW_STOCK_REFRESH_AT;
  });
  return { quote, zone, fulfilmentError, ageRestricted, stockNearlyGone };
}

/** Remaining tracked units at or below which an order refreshes the cached catalogue. */
const LOW_STOCK_REFRESH_AT = 5;

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

  const { quote, zone, fulfilmentError, ageRestricted, stockNearlyGone } = await quoteCart({
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
  if (ageRestricted && !data.ageConfirmed) {
    const message = "Please confirm you are 18 or older to order Naturo Cans.";
    return { ok: false, status: 422, error: message, fieldErrors: { ageConfirmed: message } };
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
      notes: [
        ageRestricted ? "[18+ confirmed by customer at checkout]" : "",
        data.customer.whatsapp === false ? "[Not on WhatsApp]" : "",
        data.notes,
      ]
        .filter(Boolean)
        .join("\n"),
      accessTokenHash: hashAccessToken(accessToken),
    });
  } catch (err) {
    if (err instanceof StockConflictError) return { ok: false, status: 409, error: err.message };
    if (err instanceof OrderingUnavailableError) return { ok: false, status: 503, error: err.message };
    throw err;
  }
  // The shop caches the catalogue for a day; show "low stock" / "sold out" without waiting for that.
  if (stockNearlyGone) {
    try {
      revalidateTag("catalog", "max");
    } catch {
      // Outside a request scope (tests): nothing cached to refresh.
    }
  }

  // Tell the team straight away, after the customer's response has gone out.
  if (orderAlertConfigured() || process.env.ORDER_ALERT_EMAIL) {
    const placed = order;
    const alert = async () => {
      const r = await sendOrderAlert(placed);
      await repo.updateOrder(placed.id, {}, { note: r.note, actor: "system" }).catch(() => undefined);
    };
    try {
      after(alert);
    } catch {
      void alert();
    }
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

/** Re-checks an online order's status with its provider and records any change. */
export async function refreshPaymentStatus(order: OrderRecord): Promise<OrderRecord> {
  if (!isOnlinePayment(order.paymentMethod) || order.paymentStatus === "paid") return order;
  const result = await verifyOnlinePayment(order);
  if (!result || result.status === order.paymentStatus) return order;
  const updated = await getRepository().updateOrder(
    order.id,
    {
      paymentStatus: result.status,
      paymentReference: result.reference ?? order.paymentReference,
      ...(result.status === "paid" && order.status === "pending" ? { status: "confirmed" as const } : {}),
    },
    { note: `${order.paymentMethod === "pesepay" ? "Pesepay" : "Paynow"} reported: ${result.status}`, actor: order.paymentMethod },
  );
  if (updated.becamePaid) await emailReceipt(updated);
  return updated;
}

/** Sends the receipt and notes the outcome on the order timeline. Never throws. */
export async function emailReceipt(order: OrderRecord, sentBy = "system") {
  const sent = await sendReceipt(order, sentBy);
  const note = sent.ok
    ? `Receipt emailed to ${order.customer.email}`
    : "skipped" in sent
      ? "No receipt emailed: the order has no email address"
      : `Receipt email failed: ${sent.error}`.slice(0, 300);
  await getRepository()
    .updateOrder(order.id, {}, { note, actor: sentBy })
    .catch(() => undefined);
  return sent;
}
