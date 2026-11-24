import type { OrderRecord } from "@/lib/orders/types";
import type { OrderStatus } from "@/lib/types";
import type { Expense } from "./types";
import { whatsappDigits } from "@/lib/phone";

/**
 * Pure business metrics for the admin dashboard. Money in cents.
 *
 * Revenue counts PAID orders only (excluding cancelled/refunded). Profit is
 * revenue minus the cost of goods (the line's cost snapshot, else the current
 * unit cost) minus expenses in the same period. Lines with no cost entered are
 * counted as "uncosted" so the dashboard can say profit is an estimate.
 */

const DAY = 86_400_000;
const HARARE_OFFSET = 2 * 60 * 60 * 1000; // Africa/Harare is UTC+2 all year

/** Calendar day key (YYYY-MM-DD) in Harare time. */
export function dayKey(ms: number): string {
  return new Date(ms + HARARE_OFFSET).toISOString().slice(0, 10);
}

export function startOfHarareDay(ms: number): number {
  const d = new Date(ms + HARARE_OFFSET);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - HARARE_OFFSET;
}

export const isRevenue = (o: OrderRecord) => o.paymentStatus === "paid" && o.status !== "cancelled";

export function orderCost(o: OrderRecord, costs: Record<string, number | null>) {
  let cogs = 0;
  let uncosted = 0;
  for (const l of o.lines) {
    const unit = l.unitCost ?? costs[l.variantId] ?? null;
    if (unit === null) uncosted += l.quantity;
    else cogs += unit * l.quantity;
  }
  return { cogs, uncosted };
}

export interface Summary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  margin: number | null; // net profit / revenue
  paidOrders: number;
  orders: number;
  avgOrder: number;
  uncostedUnits: number;
}

export function summarise(orders: OrderRecord[], expenses: Expense[], costs: Record<string, number | null>, fromMs: number, toMs = Date.now()): Summary {
  const inRange = orders.filter((o) => {
    const t = Date.parse(o.createdAt);
    return t >= fromMs && t < toMs;
  });
  const paid = inRange.filter(isRevenue);
  let revenue = 0;
  let cogs = 0;
  let uncostedUnits = 0;
  for (const o of paid) {
    revenue += o.total;
    const c = orderCost(o, costs);
    cogs += c.cogs;
    uncostedUnits += c.uncosted;
  }
  const fromKey = dayKey(fromMs);
  const toKey = dayKey(toMs - 1);
  const exp = expenses.filter((e) => e.spentOn >= fromKey && e.spentOn <= toKey).reduce((s, e) => s + e.amount, 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - exp;
  return {
    revenue,
    cogs,
    grossProfit,
    expenses: exp,
    netProfit,
    margin: revenue > 0 ? netProfit / revenue : null,
    paidOrders: paid.length,
    orders: inRange.filter((o) => o.status !== "cancelled").length,
    avgOrder: paid.length ? Math.round(revenue / paid.length) : 0,
    uncostedUnits,
  };
}

export interface DayPoint {
  key: string;
  ms: number;
  revenue: number;
  profit: number;
  orders: number;
}

/** One point per Harare day for the last `days` days (oldest first). */
export function dailySeries(orders: OrderRecord[], expenses: Expense[], costs: Record<string, number | null>, days: number, now = Date.now()): DayPoint[] {
  const today = startOfHarareDay(now);
  const points: DayPoint[] = [];
  const index = new Map<string, DayPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const ms = today - i * DAY;
    const p = { key: dayKey(ms), ms, revenue: 0, profit: 0, orders: 0 };
    points.push(p);
    index.set(p.key, p);
  }
  for (const o of orders) {
    const p = index.get(dayKey(Date.parse(o.createdAt)));
    if (!p || o.status === "cancelled") continue;
    p.orders += 1;
    if (isRevenue(o)) {
      p.revenue += o.total;
      p.profit += o.total - orderCost(o, costs).cogs;
    }
  }
  for (const e of expenses) {
    const p = index.get(e.spentOn);
    if (p) p.profit -= e.amount;
  }
  return points;
}

/** Groups daily points into weeks (for 90-day views) or months (for a year). */
export function bucket(points: DayPoint[], size: "week" | "month"): DayPoint[] {
  const out: DayPoint[] = [];
  for (const p of points) {
    const key = size === "month" ? p.key.slice(0, 7) : dayKey(p.ms - ((new Date(p.ms + HARARE_OFFSET).getUTCDay() + 6) % 7) * DAY);
    let b = out[out.length - 1];
    if (!b || b.key !== key) {
      b = { key, ms: p.ms, revenue: 0, profit: 0, orders: 0 };
      out.push(b);
    }
    b.revenue += p.revenue;
    b.profit += p.profit;
    b.orders += p.orders;
  }
  return out;
}

export interface ProductPerformance {
  name: string;
  units: number;
  revenue: number;
  profit: number | null;
}

export function topProducts(orders: OrderRecord[], costs: Record<string, number | null>, fromMs: number, limit = 6): ProductPerformance[] {
  const map = new Map<string, ProductPerformance & { costed: boolean }>();
  for (const o of orders) {
    if (!isRevenue(o) || Date.parse(o.createdAt) < fromMs) continue;
    for (const l of o.lines) {
      const row = map.get(l.productId) ?? { name: l.name, units: 0, revenue: 0, profit: 0, costed: true };
      const unit = l.unitCost ?? costs[l.variantId] ?? null;
      row.units += l.quantity;
      row.revenue += l.lineTotal;
      if (unit === null) row.costed = false;
      else row.profit = (row.profit ?? 0) + l.lineTotal - unit * l.quantity;
      map.set(l.productId, row);
    }
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map(({ costed, ...r }) => ({ ...r, profit: costed ? r.profit : null }));
}

export const PIPELINE: { id: OrderStatus; label: string }[] = [
  { id: "pending", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "out_for_delivery", label: "On the road" },
  { id: "ready_for_collection", label: "Ready to collect" },
];

export function pipelineCounts(orders: OrderRecord[]) {
  return PIPELINE.map((s) => ({ ...s, count: orders.filter((o) => o.status === s.id).length }));
}

/** Orders that need a person to act: new, unverified payment, or stuck >24h. */
export function needsAttention(orders: OrderRecord[], now = Date.now()) {
  return orders.filter((o) => {
    if (o.status === "completed" || o.status === "cancelled") return false;
    if (o.status === "pending") return true;
    if (o.paymentStatus === "failed") return true;
    if (o.paymentMethod === "manual" && o.paymentStatus === "pending") return true;
    return now - Date.parse(o.createdAt) > DAY;
  });
}

/** Request time for server components (each request renders once, so this is stable per render). */
export const requestNow = () => Date.now();

export interface Performance {
  fulfilment: { done: number; total: number; pct: number | null };
  paidRate: { paid: number; total: number; pct: number | null };
  queryResponse: { answered: number; total: number; pct: number | null };
  avgDeliveryMin: { minutes: number | null; trips: number };
  repeatRate: { repeat: number; customers: number; pct: number | null };
}

const pctOf = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

/**
 * Health numbers for the dashboard gauges.
 * - fulfilment: today's orders already completed
 * - paidRate: last 30 days, non-cancelled orders whose payment is confirmed
 * - queryResponse: last 30 days, queries that got a reply or were handled
 * - avgDeliveryMin: last 14 days, rider "start" → "delivered"
 * - repeatRate: last 90 days, customers (by phone) with 2+ orders
 */
export function performance(
  orders: OrderRecord[],
  enquiries: { id: string; status: string; createdAt: string }[],
  messages: { enquiryId: string | null }[],
  deliveries: { startedAt: string | null; deliveredAt: string | null }[],
  now = Date.now(),
): Performance {
  const today = startOfHarareDay(now);
  const todays = orders.filter((o) => Date.parse(o.createdAt) >= today && o.status !== "cancelled");
  const done = todays.filter((o) => o.status === "completed").length;

  const last30 = orders.filter((o) => Date.parse(o.createdAt) >= now - 30 * DAY && o.status !== "cancelled");
  const paid = last30.filter((o) => o.paymentStatus === "paid").length;

  const replied = new Set(messages.map((m) => m.enquiryId).filter(Boolean));
  const q30 = enquiries.filter((e) => Date.parse(e.createdAt) >= now - 30 * DAY);
  const answered = q30.filter((e) => e.status !== "new" || replied.has(e.id)).length;

  const trips = deliveries
    .filter((d) => d.startedAt && d.deliveredAt && Date.parse(d.deliveredAt) >= now - 14 * DAY)
    .map((d) => (Date.parse(d.deliveredAt!) - Date.parse(d.startedAt!)) / 60000)
    .filter((m) => m > 0 && m < 600);

  const byPhone = new Map<string, number>();
  for (const o of orders) {
    if (Date.parse(o.createdAt) < now - 90 * DAY || o.status === "cancelled") continue;
    const k = whatsappDigits(o.customer.phone, o.fulfilment?.zoneId);
    byPhone.set(k, (byPhone.get(k) ?? 0) + 1);
  }
  const repeat = [...byPhone.values()].filter((n) => n > 1).length;

  return {
    fulfilment: { done, total: todays.length, pct: pctOf(done, todays.length) },
    paidRate: { paid, total: last30.length, pct: pctOf(paid, last30.length) },
    queryResponse: { answered, total: q30.length, pct: pctOf(answered, q30.length) },
    avgDeliveryMin: { minutes: trips.length ? Math.round(trips.reduce((s, m) => s + m, 0) / trips.length) : null, trips: trips.length },
    repeatRate: { repeat, customers: byPhone.size, pct: pctOf(repeat, byPhone.size) },
  };
}
