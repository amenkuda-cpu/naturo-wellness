import { describe, expect, it } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";
import { performance } from "@/lib/ops/metrics";
import { OTP_MAX_ATTEMPTS, checkCode, codeMatches, generateCode, hashCode } from "@/lib/otp-code";

const SECRET = "server-secret";

describe("admin sign-in codes", () => {
  it("generates 6 digits", () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("binds a code to its email (case-insensitive) and secret", () => {
    const h = hashCode("123456", "Shaz@Example.com", SECRET);
    expect(codeMatches("123456", "shaz@example.com", SECRET, h)).toBe(true);
    expect(codeMatches("123456", "other@example.com", SECRET, h)).toBe(false);
    expect(codeMatches("123456", "shaz@example.com", "other-secret", h)).toBe(false);
    expect(codeMatches("12345", "shaz@example.com", SECRET, h)).toBe(false);
  });

  it("rejects used, expired and locked codes", () => {
    const now = Date.parse("2026-11-20T10:00:00Z");
    const row = { code_hash: hashCode("654321", "a@b.co", SECRET), attempts: 0, used: false, expires_at: "2026-11-20T10:05:00Z" };
    expect(checkCode(row, "654321", "a@b.co", SECRET, now)).toBe("ok");
    expect(checkCode(row, "000000", "a@b.co", SECRET, now)).toBe("wrong");
    expect(checkCode({ ...row, used: true }, "654321", "a@b.co", SECRET, now)).toBe("none");
    expect(checkCode({ ...row, expires_at: "2026-11-20T09:59:00Z" }, "654321", "a@b.co", SECRET, now)).toBe("expired");
    expect(checkCode({ ...row, attempts: OTP_MAX_ATTEMPTS }, "654321", "a@b.co", SECRET, now)).toBe("locked");
    expect(checkCode(null, "654321", "a@b.co", SECRET, now)).toBe("none");
  });
});

describe("dashboard gauges", () => {
  const now = Date.parse("2026-11-20T12:00:00+02:00");
  const o = (p: Partial<OrderRecord>) => ({ id: Math.random().toString(), createdAt: "2026-11-20T09:00:00+02:00", status: "completed", paymentStatus: "paid", customer: { fullName: "T", phone: "0771111111", email: null }, ...p }) as OrderRecord;

  it("computes fulfilment, paid rate, replies, delivery time and repeat customers", () => {
    const orders = [o({}), o({ status: "preparing", paymentStatus: "pending" }), o({ customer: { fullName: "R", phone: "0772222222", email: null } })];
    const enquiries = [{ id: "q1", status: "new", createdAt: "2026-11-19T10:00:00Z" }, { id: "q2", status: "new", createdAt: "2026-11-19T10:00:00Z" }];
    const p = performance(orders, enquiries, [{ enquiryId: "q1" }], [{ startedAt: "2026-11-20T09:00:00Z", deliveredAt: "2026-11-20T09:30:00Z" }], now);
    expect(p.fulfilment).toEqual({ done: 2, total: 3, pct: 67 });
    expect(p.paidRate.pct).toBe(67);
    expect(p.queryResponse).toEqual({ answered: 1, total: 2, pct: 50 });
    expect(p.avgDeliveryMin).toEqual({ minutes: 30, trips: 1 });
    expect(p.repeatRate).toEqual({ repeat: 1, customers: 2, pct: 50 });
  });
});

describe("WhatsApp numbers", () => {
  it("adds the right country code", async () => {
    const { whatsappDigits } = await import("@/lib/phone");
    expect(whatsappDigits("077 123 4567")).toBe("263771234567");
    expect(whatsappDigits("082 123 4567")).toBe("27821234567");
    expect(whatsappDigits("072 123 4567", "south-africa")).toBe("27721234567");
    expect(whatsappDigits("+27 72 123 4567")).toBe("27721234567");
    expect(whatsappDigits("+263 77 123 4567")).toBe("263771234567");
  });
});
