import { commerceConfig, devSamplePrices, devSampleZones } from "@/config/commerce";
import { products as baseProducts } from "@/data/products";
import type { DeliveryZone, Product } from "@/lib/types";

/** Deep-copies the local catalogue, optionally applying DEV sample prices. */
export function localCatalog(opts: { samplePrices: boolean }): Product[] {
  return baseProducts.map((p) => ({
    ...p,
    variants: p.variants.map((v) => {
      const sample = opts.samplePrices ? devSamplePrices[v.id] : undefined;
      return sample !== undefined && v.price === null
        ? { ...v, price: sample, stockStatus: v.stockStatus === "unknown" ? "in_stock" : v.stockStatus }
        : { ...v };
    }),
  }));
}

export function localZones(opts: { samplePrices: boolean }): DeliveryZone[] {
  return [...commerceConfig.deliveryZones, ...(opts.samplePrices ? devSampleZones : [])];
}
