import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { commerceConfig } from "@/config/commerce";
import { env } from "@/lib/env";
import { enabledPaymentMethods, type PaymentMethodInfo } from "@/lib/payments";
import { getRepository } from "@/lib/repositories";
import type { CurrencyCode, DeliveryZone, Product } from "@/lib/types";

/** Cached catalogue for rendering. Order creation always reloads fresh data. */
export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return getRepository().loadCatalog();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.slug === slug);
}

export interface StoreSettings {
  currency: CurrencyCode;
  orderingEnabled: boolean;
  /** Development sample prices are active: show a visible notice. */
  samplePricing: boolean;
  dataSource: "supabase" | "dev-file" | "static";
  paymentMethods: PaymentMethodInfo[];
  deliveryZones: DeliveryZone[];
  collection: { enabled: boolean; details: string | null };
  taxRateBps: number;
  pricesIncludeTax: boolean;
  maxQuantityPerLine: number;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const repo = getRepository();
  const paymentMethods = enabledPaymentMethods();
  const zones = (await repo.loadDeliveryZones()).filter((z) => z.active && z.fee !== null);
  const fulfilmentAvailable = commerceConfig.collection.enabled || zones.length > 0;
  return {
    currency: commerceConfig.currency,
    orderingEnabled: repo.canStoreOrders && paymentMethods.length > 0 && fulfilmentAvailable,
    samplePricing: env.dev.samplePrices && repo.kind !== "supabase",
    dataSource: repo.kind,
    paymentMethods,
    deliveryZones: zones,
    collection: commerceConfig.collection,
    taxRateBps: commerceConfig.taxRateBps,
    pricesIncludeTax: commerceConfig.pricesIncludeTax,
    maxQuantityPerLine: commerceConfig.maxQuantityPerLine,
  };
}
