"use client";

import { META_EXCLUDED_PATH, metaPixel } from "@/config/meta";
import type { Product, ProductVariant } from "@/lib/types";

/**
 * Meta Pixel standard events with real catalogue data. Every call is a no-op
 * when the pixel is off, on excluded pages, or if fbq fails to load
 * (ad blockers): tracking must never break shopping.
 */

type Fbq = ((...args: unknown[]) => void) & { disablePushState?: boolean };

declare global {
  interface Window {
    fbq?: Fbq;
    __naturoPixelInit?: () => void;
    __naturoPixelLastPage?: string;
  }
}

const usd = (cents: number | null | undefined) => Math.round(cents ?? 0) / 100;

export function metaTrack(event: string, params: Record<string, unknown> = {}, eventID?: string) {
  if (!metaPixel.enabled || typeof window === "undefined") return;
  if (META_EXCLUDED_PATH.test(window.location.pathname)) return;
  try {
    window.fbq?.("track", event, { currency: metaPixel.currency, ...params }, eventID ? { eventID } : undefined);
  } catch {
    // Never let tracking break the page.
  }
}

export function metaViewContent(product: Product, variant: ProductVariant | undefined) {
  metaTrack("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    content_category: product.category,
    value: usd(variant?.price),
  });
}

export function metaAddToCart(product: Product, variant: ProductVariant, quantity: number) {
  metaTrack("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    contents: [{ id: product.id, quantity, item_price: usd(variant.price) }],
    quantity,
    value: usd((variant.price ?? 0) * quantity),
  });
}

export function metaInitiateCheckout(lines: Array<{ productId: string; quantity: number; unitPrice: number | null }>) {
  if (!lines.length) return;
  metaTrack("InitiateCheckout", {
    content_ids: [...new Set(lines.map((l) => l.productId))],
    content_type: "product",
    contents: lines.map((l) => ({ id: l.productId, quantity: l.quantity, item_price: usd(l.unitPrice) })),
    num_items: lines.reduce((n, l) => n + l.quantity, 0),
    value: usd(lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.quantity, 0)),
  });
}

/** One Purchase per order per browser, ever (Meta also de-duplicates on eventID). */
const PURCHASE_KEY = (orderId: string) => `naturo.meta.purchase.${orderId}`;

export function purchaseAlreadySent(orderId: string): boolean {
  try {
    return window.localStorage.getItem(PURCHASE_KEY(orderId)) !== null;
  } catch {
    return false;
  }
}

export function markPurchaseSent(orderId: string) {
  try {
    window.localStorage.setItem(PURCHASE_KEY(orderId), new Date().toISOString());
  } catch {
    // Private mode: Meta's eventID de-duplication still applies.
  }
}

/** URL of the clean bridge page that reports Purchase without the order page's private link. */
export function purchaseBridgeUrl(order: {
  id: string;
  total: number;
  lines: Array<{ productId: string; quantity: number }>;
}) {
  const q = new URLSearchParams({
    eid: order.id,
    value: usd(order.total).toFixed(2),
    currency: metaPixel.currency,
    ids: [...new Set(order.lines.map((l) => l.productId))].join(","),
    n: String(order.lines.reduce((n, l) => n + l.quantity, 0)),
  });
  return `/meta-pixel-bridge?${q.toString()}`;
}
