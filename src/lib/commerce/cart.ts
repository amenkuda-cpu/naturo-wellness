import type { CartLine } from "@/lib/types";

/** Pure cart operations (used by the client store and covered by unit tests). */

export const MAX_QTY = 24;

const clampQty = (q: number, max = MAX_QTY) => Math.max(0, Math.min(max, Math.floor(q)));

export function addLine(lines: CartLine[], line: CartLine, max = MAX_QTY): CartLine[] {
  const qty = clampQty(line.quantity, max);
  if (qty <= 0) return lines;
  const idx = lines.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
  if (idx === -1) return [...lines, { ...line, quantity: qty }];
  return lines.map((l, i) => (i === idx ? { ...l, quantity: clampQty(l.quantity + qty, max) } : l));
}

export function setLineQuantity(lines: CartLine[], variantId: string, quantity: number, max = MAX_QTY): CartLine[] {
  const qty = clampQty(quantity, max);
  if (qty === 0) return removeLine(lines, variantId);
  return lines.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l));
}

export function removeLine(lines: CartLine[], variantId: string): CartLine[] {
  return lines.filter((l) => l.variantId !== variantId);
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Validates untrusted data (e.g. from localStorage). */
export function sanitiseLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  const out: CartLine[] = [];
  for (const raw of input.slice(0, 50)) {
    if (!raw || typeof raw !== "object") continue;
    const { productId, variantId, quantity } = raw as Record<string, unknown>;
    if (typeof productId !== "string" || typeof variantId !== "string") continue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    const q = clampQty(quantity);
    if (q > 0) out.push({ productId: productId.slice(0, 80), variantId: variantId.slice(0, 120), quantity: q });
  }
  return out;
}
