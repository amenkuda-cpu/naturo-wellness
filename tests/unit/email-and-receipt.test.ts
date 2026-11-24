import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";

vi.mock("@/lib/ops/repository", () => ({ getSystemOps: () => ({ addMessage: async () => ({}) }) }));

const order: OrderRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  orderNumber: "NAT-2611-ABCD",
  createdAt: "2026-11-21T08:00:00.000Z",
  status: "confirmed",
  paymentStatus: "paid",
  paymentMethod: "pesepay",
  paymentReference: "PSP-123",
  paymentData: {},
  currency: "USD",
  customer: { fullName: "Tendai <Moyo>", phone: "0771234567", email: "tendai@example.com" },
  customerId: null,
  fulfilment: { method: "delivery", zoneId: "harare", zoneName: "Harare & Chitungwiza", address: { line1: "12 Main St", suburb: "Avondale", city: "Harare", instructions: "" } },
  lines: [{ productId: "ginger-shot", variantId: "ginger-shot-standard", name: "Ginger Shot", variantLabel: "Bottle · 100 ml", unitPrice: 200, quantity: 3, lineTotal: 600 }],
  subtotal: 600,
  discount: 100,
  deliveryFee: 200,
  tax: 0,
  total: 700,
  promoCode: "WELCOME",
  notes: "",
  accessTokenHash: "x",
  history: [{ at: "2026-11-21T08:05:00.000Z", status: null, paymentStatus: "paid", note: "Pesepay reported: paid", actor: "pesepay" }],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("receipt", () => {
  it("lists items, totals, payment and reference, and escapes customer text", async () => {
    const { buildReceipt } = await import("@/lib/orders/receipt");
    const r = buildReceipt(order);
    expect(r.subject).toBe("Your Naturo receipt · Order NAT-2611-ABCD");
    expect(r.text).toContain("3 × Ginger Shot (Bottle · 100 ml)");
    expect(r.text).toContain("Discount (WELCOME): -$1.00");
    expect(r.text).toContain("Total paid: $7.00");
    expect(r.text).toContain("ref PSP-123");
    expect(r.html).toContain("Tendai &lt;Moyo&gt;");
    expect(r.html).not.toContain("<Moyo>");
  });

  it("skips orders without an email address", async () => {
    const { sendReceipt } = await import("@/lib/orders/receipt");
    const r = await sendReceipt({ ...order, customer: { ...order.customer, email: null } });
    expect(r.ok).toBe(false);
    expect("skipped" in r).toBe(true);
  });

  it("sends from billing@ through ZeptoMail", async () => {
    vi.stubEnv("ZEPTOMAIL_TOKEN", "Zoho-enczapikey abc123");
    const calls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ request_id: "req-1", data: [{ code: "EM_104" }] }), { status: 201 });
    });
    const { sendReceipt } = await import("@/lib/orders/receipt");
    const r = await sendReceipt(order);
    expect(r).toEqual({ ok: true, id: "req-1" });
    expect(calls[0].url).toBe("https://api.zeptomail.com/v1.1/email");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Zoho-enczapikey abc123");
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.from).toEqual({ address: "billing@getnaturo.com", name: "Naturo Wellness Billing" });
    expect(body.to[0].email_address.address).toBe("tendai@example.com");
    expect(body.htmlbody).toContain("Payment received");
  });
});

describe("email", () => {
  it("sends sign-in codes from noreply@ and reports ZeptoMail errors", async () => {
    vi.stubEnv("ZEPTOMAIL_TOKEN", "abc123");
    let sentFrom = "";
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      sentFrom = JSON.parse(String(init.body)).from.address;
      return new Response(JSON.stringify({ error: { message: "Invalid API Token found", details: [{ message: "check the token" }] } }), { status: 401 });
    });
    const { sendEmail } = await import("@/lib/email");
    const r = await sendEmail({ from: "noreply", to: "a@example.com", subject: "123456", text: "code" });
    expect(sentFrom).toBe("noreply@getnaturo.com");
    expect(r).toEqual({ ok: false, error: "Invalid API Token found: check the token" });
  });

  it("parses display-name addresses", async () => {
    const { parseAddress } = await import("@/lib/email");
    expect(parseAddress("Naturo Wellness <support@getnaturo.com>")).toEqual({ name: "Naturo Wellness", address: "support@getnaturo.com" });
    expect(parseAddress("admin@getnaturo.com")).toEqual({ name: "", address: "admin@getnaturo.com" });
  });
});
