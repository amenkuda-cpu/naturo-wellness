import { describe, expect, it } from "vitest";
import { checkoutSchema, fieldErrors, isValidPhone, normalisePhone } from "@/lib/commerce/validation";

const valid = {
  items: [{ productId: "ginger-shot", variantId: "ginger-shot-standard", quantity: 2 }],
  customer: { fullName: "Tendai Moyo", phone: "077 123 4567", email: "" },
  fulfilment: { method: "collection" },
  paymentMethod: "cash_on_delivery",
  promoCode: "",
  notes: "",
  acceptTerms: true,
};

describe("phone numbers", () => {
  it("accepts Zimbabwean mobile formats and E.164", () => {
    for (const p of ["0771234567", "077 123 4567", "+263 77 123 4567", "263771234567", "+447700900123"]) {
      expect(isValidPhone(p), p).toBe(true);
    }
  });
  it("rejects junk", () => {
    for (const p of ["12345", "abc", "0612345678", "+263 77 123"]) expect(isValidPhone(p), p).toBe(false);
  });
  it("normalises separators", () => {
    expect(normalisePhone("+263 (77) 123-4567")).toBe("+263771234567");
  });
});

describe("checkoutSchema", () => {
  it("parses a valid collection order and normalises fields", () => {
    const r = checkoutSchema.parse(valid);
    expect(r.customer.phone).toBe("0771234567");
    expect(r.customer.email).toBeNull();
  });

  it("requires a full address for delivery", () => {
    const r = checkoutSchema.safeParse({ ...valid, fulfilment: { method: "delivery", zoneId: "z", address: { line1: "", suburb: "", city: "" } } });
    expect(r.success).toBe(false);
    const errs = fieldErrors(r.error!);
    expect(Object.keys(errs)).toEqual(
      expect.arrayContaining(["fulfilment.address.line1", "fulfilment.address.suburb", "fulfilment.address.city"]),
    );
  });

  it("rejects empty carts, bad quantities, unknown payment methods and unaccepted terms", () => {
    const errs = fieldErrors(
      checkoutSchema.safeParse({
        ...valid,
        items: [{ productId: "x", variantId: "y", quantity: 0 }],
        paymentMethod: "bitcoin",
        acceptTerms: false,
      }).error!,
    );
    expect(errs["items.0.quantity"]).toBeDefined();
    expect(errs.paymentMethod).toBeDefined();
    expect(errs.acceptTerms).toBeDefined();
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it("ignores any client-supplied price fields", () => {
    const r = checkoutSchema.parse({ ...valid, items: [{ ...valid.items[0], price: 1 }], total: 1 });
    expect(r.items[0]).not.toHaveProperty("price");
    expect(r).not.toHaveProperty("total");
  });
});
