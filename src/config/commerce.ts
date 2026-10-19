import type { CurrencyCode, DeliveryZone } from "@/lib/types";

/**
 * Store-wide commerce settings (safe to import on the client).
 * When Supabase is connected, delivery zones are read from the
 * `delivery_zones` table instead of `deliveryZones` below.
 */
export const commerceConfig = {
  currency: "USD" as CurrencyCode,
  /** Basis points, e.g. 1500 = 15 %. 0 = no tax line shown. Confirm with your accountant. */
  taxRateBps: Number(process.env.NEXT_PUBLIC_TAX_RATE_BPS ?? 0),
  pricesIncludeTax: true,
  maxQuantityPerLine: 24,
  maxLinesPerOrder: 30,
  collection: {
    enabled: process.env.NEXT_PUBLIC_COLLECTION_ENABLED !== "false",
    /** Shown at checkout. Null = "Collection details will be confirmed by our team." */
    details: process.env.NEXT_PUBLIC_COLLECTION_DETAILS || null,
  },
  /**
   * Delivery zones. Zones without a configured `fee` are not offered at
   * checkout. Intentionally empty until Naturo confirms areas & fees.
   */
  deliveryZones: [] as DeliveryZone[],
};

/** Development-only sample zones (enabled with NATURO_DEV_SAMPLE_PRICES). */
export const devSampleZones: DeliveryZone[] = [
  {
    id: "sample-zone-a",
    name: "Sample Zone A (development only)",
    description: "Not a real delivery area. For testing checkout.",
    fee: 300,
    active: true,
  },
  {
    id: "sample-zone-b",
    name: "Sample Zone B (development only)",
    description: "Not a real delivery area. For testing checkout.",
    fee: 600,
    active: true,
  },
];

/**
 * Development-only sample prices in cents, applied only to products that have
 * no catalogue price yet. NEVER used in production builds.
 */
export const devSamplePrices: Record<string, number> = {
  // Muvhee intentionally left unpriced to exercise the "Price coming soon" state.
  "ginger-lemon-carrot-powder-standard": 400,
};

/** True when a variant's price came from `devSamplePrices` (labelled "Sample price" in development). */
export const isDevSamplePrice = (variantId: string | undefined) =>
  Boolean(variantId && Object.hasOwn(devSamplePrices, variantId));
