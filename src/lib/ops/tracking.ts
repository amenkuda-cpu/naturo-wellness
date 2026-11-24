import "server-only";
import { env } from "@/lib/env";
import type { OrderRecord } from "@/lib/orders/types";
import type { TrackedDelivery, TrackingPayload } from "@/components/tracking/live-map";
import type { Delivery, OpsRepository } from "./types";

/** Orders that belong on a live map: on the road, or recently delivered with a delivery record. */
export function isTrackable(o: OrderRecord, d: Delivery | null) {
  if (o.fulfilment.method !== "delivery") return false;
  if (o.status === "out_for_delivery") return true;
  return Boolean(d && (d.startedAt || d.dest) && ["confirmed", "preparing"].includes(o.status));
}

export async function buildTracking(
  ops: OpsRepository,
  orders: OrderRecord[],
  opts: { includeCustomer: boolean; trailLimit?: number },
): Promise<TrackingPayload> {
  const deliveries = await ops.listDeliveries(orders.map((o) => o.id));
  const byId = new Map(deliveries.map((d) => [d.orderId, d]));
  const tracked: TrackedDelivery[] = await Promise.all(
    orders.map(async (o) => {
      const d = byId.get(o.id) ?? null;
      const pings = d?.startedAt ? await ops.listPings(o.id, opts.trailLimit ?? 400) : [];
      const since = d?.startedAt ? Date.parse(d.startedAt) : 0;
      const trail = pings.filter((p) => Date.parse(p.at) >= since).map((p) => ({ lat: p.lat, lng: p.lng, at: p.at, speed: p.speed }));
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: opts.includeCustomer ? o.customer.fullName : undefined,
        status: o.status,
        dest: d?.dest ?? null,
        destLabel: opts.includeCustomer ? d?.destLabel ?? null : null,
        riderName: d?.riderName ? (opts.includeCustomer ? d.riderName : d.riderName.split(" ")[0]) : null,
        startedAt: d?.startedAt ?? null,
        deliveredAt: d?.deliveredAt ?? null,
        last: trail.at(-1) ?? null,
        trail,
      };
    }),
  );
  return { origin: { ...env.dispatch }, deliveries: tracked };
}

/** Looks up an address on OpenStreetMap (Nominatim). Used when staff set the drop-off pin. */
export async function geocode(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=zw,za&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "NaturoWellnessAdmin/1.0 (+https://getnaturo.com)", "Accept-Language": "en" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name.slice(0, 200) } : null;
  } catch {
    return null;
  }
}
