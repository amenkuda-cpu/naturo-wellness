import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import {
  buildQuote,
  computeTax,
  evaluatePromotion,
  formatMoney,
  fromPrice,
  isProductPurchasable,
  isVariantPurchasable,
  type QuoteInput,
} from "@/lib/commerce/pricing";
import type { Product, Promotion } from "@/lib/types";

function makeProduct(id: string, price: number | null, extra: Partial<Product["variants"][0]> = {}, enabled = true): Product {
  const base = products[0];
  return {
    ...base,
    id,
    slug: id,
    name: id,
    enabledForSale: enabled,
    variants: [{ id: `${id}-v`, sku: null, label: "Single", size: null, price, compareAtPrice: null, stockStatus: "in_stock", stockQuantity: null, ...extra }],
  };
}

const catalog = [
  makeProduct("a", 250),
  makeProduct("b", 400),
  makeProduct("unpriced", null),
  makeProduct("disabled", 300, {}, false),
  makeProduct("oos", 300, { stockStatus: "out_of_stock" }),
  makeProduct("tracked", 300, { stockQuantity: 2 }),
];

const base = (over: Partial<QuoteInput> = {}): QuoteInput => ({
  lines: [],
  catalog,
  deliveryFee: null,
  promotion: null,
  taxRateBps: 0,
  pricesIncludeTax: true,
  maxQuantityPerLine: 24,
  currency: "USD",
  ...over,
});

const promo = (over: Partial<Promotion> = {}): Promotion => ({
  code: "SAVE10",
  kind: "percent",
  value: 10,
  minSubtotal: null,
  active: true,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usageCount: 0,
  ...over,
});

describe("purchasability", () => {
  it("requires enabled product, positive integer price and stock", () => {
    const v = (p: Product) => isVariantPurchasable(p, p.variants[0]);
    expect(v(catalog[0])).toBe(true);
    expect(v(catalog[2])).toBe(false); // no price
    expect(v(catalog[3])).toBe(false); // disabled
    expect(v(catalog[4])).toBe(false); // out of stock
    expect(v(makeProduct("zero", 0))).toBe(false);
    expect(v(makeProduct("fraction", 2.5))).toBe(false);
    expect(v(makeProduct("noqty", 100, { stockQuantity: 0 }))).toBe(false);
  });

  it("ships the real catalogue with no prices, so nothing is purchasable by default", () => {
    expect(products.every((p) => !isProductPurchasable(p))).toBe(true);
    expect(products.every((p) => fromPrice(p) === null)).toBe(true);
  });
});

describe("buildQuote", () => {
  it("totals lines and merges duplicates", () => {
    const q = buildQuote(
      base({
        lines: [
          { productId: "a", variantId: "a-v", quantity: 2 },
          { productId: "b", variantId: "b-v", quantity: 1 },
          { productId: "a", variantId: "a-v", quantity: 1 },
        ],
      }),
    );
    expect(q.lines).toHaveLength(2);
    expect(q.lines.find((l) => l.productId === "a")?.quantity).toBe(3);
    expect(q.subtotal).toBe(250 * 3 + 400);
    expect(q.total).toBe(1150);
    expect(q.itemCount).toBe(4);
    expect(q.issues).toHaveLength(0);
  });

  it("excludes and reports items that cannot be sold", () => {
    const q = buildQuote(
      base({
        lines: [
          { productId: "a", variantId: "a-v", quantity: 1 },
          { productId: "unpriced", variantId: "unpriced-v", quantity: 1 },
          { productId: "disabled", variantId: "disabled-v", quantity: 1 },
          { productId: "oos", variantId: "oos-v", quantity: 1 },
          { productId: "ghost", variantId: "ghost-v", quantity: 1 },
          { productId: "tracked", variantId: "tracked-v", quantity: 3 },
          { productId: "b", variantId: "b-v", quantity: 99 },
        ],
      }),
    );
    expect(q.lines.map((l) => l.productId)).toEqual(["a"]);
    expect(q.subtotal).toBe(250);
    const codes = Object.fromEntries(q.issues.map((i) => [i.productId, i.code]));
    expect(codes).toEqual({
      unpriced: "not_for_sale",
      disabled: "not_for_sale",
      oos: "out_of_stock",
      ghost: "unknown_product",
      tracked: "insufficient_stock",
      b: "invalid_quantity",
    });
    expect(q.issues.find((i) => i.code === "insufficient_stock")?.available).toBe(2);
  });

  it("adds delivery only when there are payable lines", () => {
    expect(buildQuote(base({ lines: [{ productId: "a", variantId: "a-v", quantity: 1 }], deliveryFee: 300 })).total).toBe(550);
    expect(buildQuote(base({ lines: [], deliveryFee: 300 })).total).toBe(0);
  });

  it("applies a valid promotion before delivery", () => {
    const q = buildQuote(
      base({ lines: [{ productId: "b", variantId: "b-v", quantity: 2 }], deliveryFee: 300, promotion: promo(), promoCode: "save10" }),
    );
    expect(q.discount).toBe(80);
    expect(q.total).toBe(800 - 80 + 300);
    expect(q.promotionCode).toBe("SAVE10");
  });

  it("adds exclusive tax but only reports inclusive tax", () => {
    const lines = [{ productId: "b", variantId: "b-v", quantity: 1 }];
    const excl = buildQuote(base({ lines, taxRateBps: 1500, pricesIncludeTax: false }));
    expect(excl.tax).toBe(60);
    expect(excl.total).toBe(460);
    const incl = buildQuote(base({ lines, taxRateBps: 1500, pricesIncludeTax: true }));
    expect(incl.tax).toBe(52);
    expect(incl.total).toBe(400);
  });
});

describe("evaluatePromotion", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it("rejects unknown, inactive, expired, future, exhausted and under-minimum codes", () => {
    expect(evaluatePromotion(null, "X", 1000, now).error).toMatch(/valid/);
    expect(evaluatePromotion(promo({ active: false }), "SAVE10", 1000, now).error).toMatch(/valid/);
    expect(evaluatePromotion(promo({ endsAt: "2026-01-01T00:00:00Z" }), "SAVE10", 1000, now).error).toMatch(/expired/);
    expect(evaluatePromotion(promo({ startsAt: "2027-01-01T00:00:00Z" }), "SAVE10", 1000, now).error).toMatch(/active yet/);
    expect(evaluatePromotion(promo({ usageLimit: 5, usageCount: 5 }), "SAVE10", 1000, now).error).toMatch(/limit/);
    expect(evaluatePromotion(promo({ minSubtotal: 2000 }), "SAVE10", 1000, now).error).toMatch(/at least/);
  });

  it("caps fixed discounts at the subtotal and clamps percentages", () => {
    expect(evaluatePromotion(promo({ kind: "fixed", value: 5000 }), "SAVE10", 1200, now).discount).toBe(1200);
    expect(evaluatePromotion(promo({ value: 150 }), "SAVE10", 1000, now).discount).toBe(1000);
  });

  it("returns no discount and no error when no code is given", () => {
    expect(evaluatePromotion(promo(), "", 1000, now)).toEqual({ discount: 0, error: null, code: null });
  });
});

describe("helpers", () => {
  it("computes tax in minor units", () => {
    expect(computeTax(1000, 0, false)).toBe(0);
    expect(computeTax(1000, 1500, false)).toBe(150);
  });
  it("formats USD", () => {
    expect(formatMoney(250, "USD")).toContain("2.50");
  });
});
