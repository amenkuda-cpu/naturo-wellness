import type { CartLine, CurrencyCode, Product, ProductVariant, Promotion } from "@/lib/types";

/**
 * Pure pricing engine. The SAME function produces the client-side estimate
 * and the server-side authoritative quote. Only the server's result (built
 * from freshly loaded catalogue data) is ever persisted on an order.
 */

export function isVariantPurchasable(product: Product, variant: ProductVariant): boolean {
  return (
    product.enabledForSale &&
    variant.price !== null &&
    Number.isInteger(variant.price) &&
    variant.price > 0 &&
    variant.stockStatus !== "out_of_stock" &&
    (variant.stockQuantity === null || variant.stockQuantity > 0)
  );
}

export function isProductPurchasable(product: Product): boolean {
  return product.variants.some((v) => isVariantPurchasable(product, v));
}

/** Lowest price among a product's variants, or null when none is priced. */
export function fromPrice(product: Product): number | null {
  const prices = product.variants.map((v) => v.price).filter((p): p is number => p !== null && p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export interface PricedLine {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type QuoteIssueCode =
  | "unknown_product"
  | "not_for_sale"
  | "out_of_stock"
  | "insufficient_stock"
  | "invalid_quantity";

export interface QuoteIssue {
  productId: string;
  variantId: string;
  code: QuoteIssueCode;
  message: string;
  /** For insufficient_stock: how many are available. */
  available?: number;
}

export interface QuoteInput {
  lines: CartLine[];
  catalog: Product[];
  /** Null = no delivery fee applicable (collection) or not yet chosen. */
  deliveryFee: number | null;
  promotion: Promotion | null;
  promoCode?: string | null;
  taxRateBps: number;
  pricesIncludeTax: boolean;
  maxQuantityPerLine: number;
  currency: CurrencyCode;
  now?: Date;
}

export interface Quote {
  currency: CurrencyCode;
  lines: PricedLine[];
  issues: QuoteIssue[];
  itemCount: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  /** True when `tax` is already included in prices (informational line only). */
  taxIncluded: boolean;
  total: number;
  promotionCode: string | null;
  promotionError: string | null;
}

export function evaluatePromotion(
  promotion: Promotion | null,
  code: string | null | undefined,
  subtotal: number,
  nowInput?: Date,
): { discount: number; error: string | null; code: string | null } {
  if (!code) return { discount: 0, error: null, code: null };
  const normalised = code.trim().toUpperCase();
  if (!promotion || promotion.code.toUpperCase() !== normalised || !promotion.active) {
    return { discount: 0, error: "This code isn't valid.", code: null };
  }
  // Read the clock only when a promotion is actually evaluated.
  const now = nowInput ?? new Date();
  if (promotion.startsAt && now < new Date(promotion.startsAt)) {
    return { discount: 0, error: "This code isn't active yet.", code: null };
  }
  if (promotion.endsAt && now > new Date(promotion.endsAt)) {
    return { discount: 0, error: "This code has expired.", code: null };
  }
  if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) {
    return { discount: 0, error: "This code has reached its usage limit.", code: null };
  }
  if (promotion.minSubtotal !== null && subtotal < promotion.minSubtotal) {
    return {
      discount: 0,
      error: `Spend at least ${formatMoney(promotion.minSubtotal)} to use this code.`,
      code: null,
    };
  }
  let discount = 0;
  if (promotion.kind === "percent") {
    const pct = Math.min(Math.max(promotion.value, 0), 100);
    discount = Math.round((subtotal * pct) / 100);
  } else {
    discount = Math.max(0, Math.round(promotion.value));
  }
  return { discount: Math.min(discount, subtotal), error: null, code: promotion.code };
}

export function computeTax(taxable: number, rateBps: number, included: boolean): number {
  if (rateBps <= 0 || taxable <= 0) return 0;
  const rate = rateBps / 10_000;
  return included ? Math.round(taxable - taxable / (1 + rate)) : Math.round(taxable * rate);
}

export function buildQuote(input: QuoteInput): Quote {
  const issues: QuoteIssue[] = [];
  const lines: PricedLine[] = [];

  // Merge duplicate lines for the same variant.
  const merged = new Map<string, CartLine>();
  for (const line of input.lines) {
    const key = `${line.productId}::${line.variantId}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + line.quantity } : { ...line });
  }

  for (const line of merged.values()) {
    const product = input.catalog.find((p) => p.id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    const base = { productId: line.productId, variantId: line.variantId };

    if (!product || !variant) {
      issues.push({ ...base, code: "unknown_product", message: "This item is no longer available." });
      continue;
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > input.maxQuantityPerLine) {
      issues.push({
        ...base,
        code: "invalid_quantity",
        message: `Choose between 1 and ${input.maxQuantityPerLine}.`,
      });
      continue;
    }
    if (variant.stockStatus === "out_of_stock" || variant.stockQuantity === 0) {
      issues.push({ ...base, code: "out_of_stock", message: `${product.name} is out of stock.` });
      continue;
    }
    if (!isVariantPurchasable(product, variant)) {
      issues.push({
        ...base,
        code: "not_for_sale",
        message: `${product.name} isn't available to order online yet.`,
      });
      continue;
    }
    if (variant.stockQuantity !== null && line.quantity > variant.stockQuantity) {
      issues.push({
        ...base,
        code: "insufficient_stock",
        message: `Only ${variant.stockQuantity} of ${product.name} available.`,
        available: variant.stockQuantity,
      });
      continue;
    }
    const unitPrice = variant.price!;
    lines.push({
      ...base,
      name: product.name,
      variantLabel: variant.size ? `${variant.label} · ${variant.size}` : variant.label,
      unitPrice,
      quantity: line.quantity,
      lineTotal: unitPrice * line.quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const promo = evaluatePromotion(input.promotion, input.promoCode, subtotal, input.now);
  const deliveryFee = lines.length ? Math.max(0, input.deliveryFee ?? 0) : 0;
  const taxable = subtotal - promo.discount;
  const tax = computeTax(taxable, input.taxRateBps, input.pricesIncludeTax);
  const total = taxable + deliveryFee + (input.pricesIncludeTax ? 0 : tax);

  return {
    currency: input.currency,
    lines,
    issues,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    discount: promo.discount,
    deliveryFee,
    tax,
    taxIncluded: input.pricesIncludeTax,
    total,
    promotionCode: promo.code,
    promotionError: promo.error,
  };
}

export function formatMoney(minor: number, currency: CurrencyCode = "USD"): string {
  return new Intl.NumberFormat("en-ZW", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(minor / 100);
}
