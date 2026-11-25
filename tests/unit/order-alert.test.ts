import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";

const order: OrderRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  orderNumber: "NAT-2611-WXYZ",
  createdAt: "2026-11-25T08:00:00.000Z",
  status: "pending",
  paymentStatus: "unpaid",
  paymentMethod: "cash_on_delivery",
  paymentReference: null,
  paymentData: {},
  currency: "USD",
  customer: { fullName: "Rudo Chikore", phone: "0771234567", email: "rudo@example.com" },
  customerId: null,
  fulfilment: { method: "delivery", zoneId: "harare", zoneName: "Harare CBD", address: { line1: "12 Main St", suburb: "CBD", city: "Harare", instructions: "Gate 2" } },
  lines: [{ productId: "ginger-shot", variantId: "ginger-shot-standard", name: "Ginger Shot", variantLabel: "Bottle · 100 ml", unitPrice: 100, quantity: 2, lineTotal: 200 }],
  subtotal: 200,
  discount: 0,
  deliveryFee: 300,
  tax: 0,
  total: 500,
  promoCode: null,
  notes: "Please call on arrival",
  accessTokenHash: "x",
  history: [],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("order alert", () => {
  it("has the order, items, customer WhatsApp link, address and admin link", async () => {
    const { buildOrderAlert } = await import("@/lib/notify/order-alert");
    const text = buildOrderAlert(order, { siteUrl: "https://getnaturo.com" });
    expect(text).toContain("New Naturo order NAT-2611-WXYZ");
    expect(text).toContain("$5.00");
    expect(text).toContain("2 × Ginger Shot (Bottle · 100 ml)");
    expect(text).toContain("https://wa.me/263771234567");
    expect(text).toContain("rudo@example.com");
    expect(text).toContain("12 Main St, CBD, Harare");
    expect(text).toContain("Please call on arrival");
    expect(text).toContain("https://getnaturo.com/admin/orders/22222222-2222-4222-8222-222222222222");
  });

  it("marks numbers that are not on WhatsApp and hides internal tags", async () => {
    const { buildOrderAlert } = await import("@/lib/notify/order-alert");
    const text = buildOrderAlert({ ...order, notes: "[Not on WhatsApp]\nRing the bell" }, { siteUrl: "https://getnaturo.com" });
    expect(text).toContain("(not on WhatsApp)");
    expect(text).not.toContain("wa.me");
    expect(text).not.toContain("[Not on WhatsApp]");
    expect(text).toContain("Ring the bell");
  });

  it("sends through CallMeBot when configured and reports failures without throwing", async () => {
    vi.stubEnv("ORDER_ALERT_WHATSAPP", "+263 77 297 2693");
    vi.stubEnv("CALLMEBOT_APIKEY", "123456");
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(url);
      return new Response("Message queued", { status: 200 });
    });
    const { sendOrderAlert, orderAlertConfigured } = await import("@/lib/notify/order-alert");
    expect(orderAlertConfigured()).toBe(true);
    expect(await sendOrderAlert(order)).toEqual({ ok: true, note: "Team alerted on WhatsApp" });
    expect(urls[0]).toContain("api.callmebot.com/whatsapp.php?phone=%2B263772972693");

    vi.stubGlobal("fetch", async () => new Response("APIKey is invalid", { status: 200 }));
    const failed = await sendOrderAlert(order);
    expect(failed.ok).toBe(false);
    expect(failed.note).toMatch(/WhatsApp alert failed/);
  });

  it("is off when nothing is configured", async () => {
    const { orderAlertConfigured, sendOrderAlert } = await import("@/lib/notify/order-alert");
    expect(orderAlertConfigured()).toBe(false);
    expect(await sendOrderAlert(order)).toEqual({ ok: false, note: "No team alert channel set up" });
  });
});
