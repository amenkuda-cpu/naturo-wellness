"use client";

import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Live delivery map. Polls a tracking endpoint, draws the rider's trail, the
 * road route still to go (OpenStreetMap routing via OSRM) and an ETA.
 * Tiles: OpenStreetMap (low-volume staff and customer use, attributed). No API keys needed.
 */

export interface TrackPoint {
  lat: number;
  lng: number;
  at?: string;
  speed?: number | null;
}

export interface TrackedDelivery {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  status: string;
  dest: { lat: number; lng: number } | null;
  destLabel: string | null;
  riderName: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  last: TrackPoint | null;
  trail: TrackPoint[];
}

export interface TrackingPayload {
  origin: { lat: number; lng: number; label: string };
  deliveries: TrackedDelivery[];
}

const COLORS = ["#E7752B", "#2B8BD6", "#D6336C", "#7A4FD8", "#139A8F", "#E9B10C"];

interface RouteInfo {
  coords: [number, number][];
  durationS: number;
  distanceM: number;
  from: TrackPoint;
  at: number;
}

function metres(a: TrackPoint, b: TrackPoint) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function fetchRoute(from: TrackPoint, to: { lat: number; lng: number }): Promise<Omit<RouteInfo, "from" | "at"> | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const r = json.routes?.[0];
    if (!r) return null;
    return { coords: r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]), durationS: r.duration, distanceM: r.distance };
  } catch {
    return null;
  }
}

/** Kitchen: a rounded-square badge with a storefront glyph. */
function originMarker() {
  return `<div style="width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#16171d;color:#d6f36a;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.3)"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg></div>`;
}

/** Drop-off: a classic teardrop map pin with a white centre. Anchored at the tip. */
function destMarker(color: string) {
  return `<svg width="30" height="40" viewBox="0 0 30 40" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,.3))"><path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 39 15 39s14-13.7 14-24.1C29 7.2 22.7 1 15 1Z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5.2" fill="#fff"/></svg>`;
}

/** Rider: a navigation arrow in a ring, rotated to the direction of travel, with a soft live pulse. */
function riderMarker(color: string, bearing: number) {
  return `<div style="position:relative;width:40px;height:40px"><span class="admin-ping" style="position:absolute;inset:6px;border-radius:999px;background:${color}"></span><span style="position:absolute;inset:5px;display:grid;place-items:center;border-radius:999px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.3)"><svg width="18" height="18" viewBox="0 0 24 24" style="transform:rotate(${Math.round(bearing)}deg)"><path d="M12 2 20 21 12 17 4 21Z" fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg></span></div>`;
}

/** Compass bearing (0 = north) between two points, for the rider arrow. */
function bearingOf(a: TrackPoint, b: TrackPoint) {
  const r = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}

export function LiveMap({
  endpoint,
  pollMs = 6000,
  height = 420,
  className,
  onPick,
  pickHint,
  showList = false,
  dark = false,
}: {
  endpoint: string;
  pollMs?: number;
  height?: number;
  className?: string;
  /** When set, clicking the map picks a point (e.g. the customer's door). */
  onPick?: (p: { lat: number; lng: number }) => void;
  pickHint?: string;
  showList?: boolean;
  /** Dark tiles and chrome for the admin. */
  dark?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const libRef = useRef<typeof L | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const routes = useRef(new Map<string, RouteInfo>());
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [updated, setUpdated] = useState<number | null>(null);
  const [routeView, setRouteView] = useState<Record<string, RouteInfo>>({});
  const [, force] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as TrackingPayload);
      setUpdated(Date.now());
      setErr(null);
    } catch {
      setErr("Can't reach the tracking service. Retrying…");
    }
  }, [endpoint]);

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const t = window.setInterval(() => document.visibilityState === "visible" && void load(), pollMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load, pollMs]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((lib) => {
      if (cancelled || !box.current || mapRef.current) return;
      const Lf = (lib as unknown as { default?: typeof L }).default ?? (lib as unknown as typeof L);
      libRef.current = Lf;
      const map = Lf.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView([-17.8292, 31.0522], 12);
      Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (e: L.LeafletMouseEvent) => pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      map.on("focus", () => map.scrollWheelZoom.enable());
      map.on("blur", () => map.scrollWheelZoom.disable());
      layerRef.current = Lf.layerGroup().addTo(map);
      mapRef.current = map;
      force((n) => n + 1);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Refresh routes when riders move (≥150 m or 60 s), so ETAs stay honest.
  useEffect(() => {
    if (!data) return;
    for (const d of data.deliveries) {
      if (!d.dest || d.deliveredAt) continue;
      const from = d.last ?? data.origin;
      const prev = routes.current.get(d.orderId);
      if (prev && metres(prev.from, from) < 150 && Date.now() - prev.at < 60_000) continue;
      routes.current.set(d.orderId, { coords: prev?.coords ?? [], durationS: prev?.durationS ?? 0, distanceM: prev?.distanceM ?? 0, from, at: Date.now() });
      void fetchRoute(from, d.dest).then((r) => {
        if (!r) return;
        const info = { ...r, from, at: Date.now() };
        routes.current.set(d.orderId, info);
        setRouteView((v) => ({ ...v, [d.orderId]: info }));
      });
    }
  }, [data]);

  // Draw.
  useEffect(() => {
    const Lf = libRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!Lf || !map || !layer || !data) return;
    layer.clearLayers();
    const bounds: [number, number][] = [[data.origin.lat, data.origin.lng]];
    Lf.marker([data.origin.lat, data.origin.lng], {
      icon: Lf.divIcon({ html: originMarker(), className: "", iconSize: [34, 34], iconAnchor: [17, 17] }),
      title: data.origin.label,
    })
      .bindTooltip(data.origin.label)
      .addTo(layer);

    data.deliveries.forEach((d, i) => {
      const color = COLORS[i % COLORS.length];
      const route = routes.current.get(d.orderId);
      if (route?.coords.length && !d.deliveredAt) {
        Lf.polyline(route.coords, { color, weight: 5, opacity: 0.35, dashArray: "2 9", lineCap: "round" }).addTo(layer);
      }
      if (d.trail.length > 1) {
        Lf.polyline(d.trail.map((p) => [p.lat, p.lng] as [number, number]), { color, weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round" }).addTo(layer);
      }
      if (d.dest) {
        bounds.push([d.dest.lat, d.dest.lng]);
        Lf.marker([d.dest.lat, d.dest.lng], { icon: Lf.divIcon({ html: destMarker(color), className: "", iconSize: [30, 40], iconAnchor: [15, 39], tooltipAnchor: [0, -30] }) })
          .bindTooltip(`${d.orderNumber}${d.customerName ? ` · ${d.customerName}` : ""}${d.destLabel ? `<br>${d.destLabel}` : ""}`)
          .addTo(layer);
      }
      if (d.last && !d.deliveredAt) {
        bounds.push([d.last.lat, d.last.lng]);
        Lf.marker([d.last.lat, d.last.lng], {
          icon: Lf.divIcon({
            html: riderMarker(color, d.trail.length > 1 ? bearingOf(d.trail[d.trail.length - 2], d.last) : d.dest ? bearingOf(d.last, d.dest) : 0),
            className: "",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
          zIndexOffset: 1000,
        })
          .bindTooltip(`${d.riderName ?? "Rider"} · ${d.orderNumber}`)
          .addTo(layer);
      }
    });
    if (!fitted.current && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      fitted.current = true;
    }
  });

  const deliveries = data?.deliveries ?? [];
  return (
    <div className={cn(className, dark && "map-dark")}>
      <div className="relative overflow-hidden rounded-[22px] border border-[var(--a-line,#ECE7D8)]" style={{ height }}>
        <div ref={box} className="h-full w-full bg-[#EEF2EA]" tabIndex={0} aria-label="Delivery map. Focus it to zoom with the scroll wheel." />
        {onPick && pickHint && (
          <span className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-white shadow-lg">{pickHint}</span>
        )}
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-[var(--a-card,#ffffff)] px-3 py-1 text-[0.7rem] font-semibold text-[var(--a-muted,#3E4A40)] shadow">
          {err ? err : updated ? `Live · updated ${new Date(updated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Loading…"}
        </span>
      </div>
      {(showList || deliveries.length === 1) && deliveries.length > 0 && (
        <ul className={cn("mt-3 grid gap-2", showList && "sm:grid-cols-2")}>
          {deliveries.map((d, i) => {
            const r = routeView[d.orderId];
            const color = COLORS[i % COLORS.length];
            const lastSeen = d.last?.at && updated ? Math.round((updated - Date.parse(d.last.at)) / 1000) : null;
            return (
              <li key={d.orderId} className="flex items-center gap-3 rounded-[16px] bg-[var(--a-inset,#FBFAF5)] px-3 py-2.5 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-[var(--a-ink,#173f2b)]">{d.orderNumber}{d.customerName ? ` · ${d.customerName}` : ""}</span>
                  <span className="block text-[var(--a-muted,#5E6B60)]">
                    {d.deliveredAt
                      ? "Delivered"
                      : !d.dest
                        ? "No drop-off pin yet"
                        : !d.last
                          ? `Not started${r?.distanceM ? ` · ${(r.distanceM / 1000).toFixed(1)} km from the kitchen` : ""}`
                          : `${d.riderName ?? "Rider"} · ${lastSeen !== null && lastSeen > 120 ? `last seen ${Math.round(lastSeen / 60)} min ago` : "moving now"}`}
                  </span>
                </span>
                {!d.deliveredAt && r && r.durationS > 0 && d.last && (
                  <span className="shrink-0 text-right">
                    <span className="block text-base font-extrabold text-[var(--a-ink,#173f2b)] tabular-nums">{Math.max(1, Math.round(r.durationS / 60))} min</span>
                    <span className="block text-xs text-[var(--a-muted,#5E6B60)] tabular-nums">{(r.distanceM / 1000).toFixed(1)} km to go</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
