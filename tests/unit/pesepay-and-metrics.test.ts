import { createDecipheriv } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";
import { dailySeries, needsAttention, orderCost, summarise, topProducts } from "@/lib/ops/metrics";
import {
  mapPesepayStatus,
  pesepayAmountMatches,
  pesepayAuthMatches,
  pesepayDecrypt,
  pesepayEncrypt,
} from "@/lib/payments/pesepay-protocol";

const KEY = "0123456789abcdef0123456789abcdef"; // 32 chars, as Pesepay issues

describe("Pesepay protocol", () => {
  it("encrypts with AES-256-CBC, key = encryption key, IV = its first 16 chars", () => {
    const payload = pesepayEncrypt({ amountDetails: { amount: 10.5, currencyCode: "USD" } }, KEY);
    const d = createDecipheriv("aes-256-cbc", Buffer.from(KEY), Buffer.from(KEY.slice(0, 16)));
    const text = Buffer.concat([d.update(Buffer.from(payload, "base64")), d.final()]).toString("utf8");
    expect(JSON.parse(text)).toEqual({ amountDetails: { amount: 10.5, currencyCode: "USD" } });
  });

  it("round-trips", () => {
    const tx = { referenceNumber: "20261120-ABC", pollUrl: "https://x", redirectUrl: "https://y" };
    expect(pesepayDecrypt(pesepayEncrypt(tx, KEY), KEY)).toEqual(tx);
  });

  it("only SUCCESS counts as paid", () => {
    expect(mapPesepayStatus("SUCCESS")).toBe("paid");
    for (const s of ["INITIATED", "PROCESSING", "PENDING", "PARTIALLY_PAID"]) expect(mapPesepayStatus(s)).toBe("pending");
    for (const s of ["FAILED", "DECLINED", "TIME_OUT", "INSUFFICIENT_FUNDS", "CLOSED_PERIOD_ELAPSED", "ERROR"]) expect(mapPesepayStatus(s)).toBe("failed");
    expect(mapPesepayStatus("CANCELLED")).toBe("cancelled");
    expect(mapPesepayStatus("REVERSED")).toBe("refunded");
  });

  it("checks amounts in cents and the callback key", () => {
    expect(pesepayAmountMatches(10.5, 1050)).toBe(true);
    expect(pesepayAmountMatches(10.49, 1050)).toBe(false);
    expect(pesepayAmountMatches(undefined, 1050)).toBe(false);
    expect(pesepayAuthMatches("secret-key", "secret-key")).toBe(true);
    expect(pesepayAuthMatches("Bearer secret-key", "secret-key")).toBe(true);
    expect(pesepayAuthMatches("wrong", "secret-key")).toBe(false);
    expect(pesepayAuthMatches(null, "secret-key")).toBe(false);
  });
});

function order(p: Partial<OrderRecord> & { at: string; lines?: OrderRecord["lines"] }): OrderRecord {
  return {
    id: Math.random().toString(36),
    orderNumber: "NW-1",
    createdAt: p.at,
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "pesepay",
    paymentReference: null,
    paymentData: {},
    currency: "USD",
    customer: { fullName: "Tari", phone: "0771234567", email: null },
    customerId: null,
    fulfilment: { method: "collection", zoneId: null, zoneName: null, address: null },
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    tax: 0,
    total: 1000,
    promoCode: null,
    notes: "",
    accessTokenHash: "",
    history: [],
    ...p,
    lines: p.lines ?? [{ productId: "ginger", variantId: "ginger-100", name: "Ginger shot", variantLabel: "100 ml", unitPrice: 500, quantity: 2, lineTotal: 1000 }],
  } as OrderRecord;
}

describe("Profit metrics", () => {
  const now = Date.parse("2026-11-20T10:00:00+02:00");
  const costs = { "ginger-100": 200 };

  it("uses the cost snapshot first, then the current unit cost", () => {
    expect(orderCost(order({ at: "2026-11-20T08:00:00+02:00" }), costs)).toEqual({ cogs: 400, uncosted: 0 });
    const snap = order({ at: "2026-11-20T08:00:00+02:00", lines: [{ productId: "g", variantId: "ginger-100", name: "G", variantLabel: "", unitPrice: 500, quantity: 2, lineTotal: 1000, unitCost: 150 }] });
    expect(orderCost(snap, costs).cogs).toBe(300);
    expect(orderCost(order({ at: "2026-11-20T08:00:00+02:00" }), {}).uncosted).toBe(2);
  });

  it("counts only paid, non-cancelled orders as revenue and subtracts expenses", () => {
    const orders = [
      order({ at: "2026-11-20T08:00:00+02:00" }),
      order({ at: "2026-11-20T09:00:00+02:00", paymentStatus: "pending", status: "pending" }),
      order({ at: "2026-11-20T09:30:00+02:00", status: "cancelled" }),
    ];
    const expenses = [{ id: "e", spentOn: "2026-11-20", category: "packaging" as const, description: "Bottles", amount: 100, createdBy: "", createdAt: "" }];
    const s = summarise(orders, expenses, costs, Date.parse("2026-11-20T00:00:00+02:00"), now);
    expect(s).toMatchObject({ revenue: 1000, cogs: 400, grossProfit: 600, expenses: 100, netProfit: 500, paidOrders: 1, orders: 2 });
  });

  it("buckets by Harare day", () => {
    // 23:30 UTC on the 19th is 01:30 on the 20th in Harare.
    const pts = dailySeries([order({ at: "2026-11-19T23:30:00Z" })], [], costs, 2, now);
    expect(pts.map((p) => [p.key, p.revenue])).toEqual([["2026-11-19", 0], ["2026-11-20", 1000]]);
  });

  it("ranks best sellers and flags orders needing attention", () => {
    expect(topProducts([order({ at: "2026-11-20T08:00:00+02:00" })], costs, 0)[0]).toMatchObject({ name: "Ginger shot", units: 2, revenue: 1000, profit: 600 });
    const waiting = order({ at: "2026-11-20T09:00:00+02:00", status: "pending", paymentStatus: "unpaid" });
    const fine = order({ at: "2026-11-20T09:00:00+02:00", status: "preparing", paymentStatus: "paid" });
    expect(needsAttention([waiting, fine], now)).toEqual([waiting]);
  });
});
