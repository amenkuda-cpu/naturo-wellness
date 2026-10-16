import { describe, expect, it } from "vitest";
import { addLine, countItems, removeLine, sanitiseLines, setLineQuantity } from "@/lib/commerce/cart";

const line = (variantId: string, quantity: number) => ({ productId: variantId.split("-")[0], variantId, quantity });

describe("cart operations", () => {
  it("adds and merges lines, clamping to the max", () => {
    let lines = addLine([], line("a-v", 2));
    lines = addLine(lines, line("a-v", 3));
    lines = addLine(lines, line("b-v", 1));
    expect(lines).toEqual([line("a-v", 5), line("b-v", 1)]);
    expect(addLine(lines, line("a-v", 100), 24)[0].quantity).toBe(24);
    expect(addLine([], line("a-v", 0))).toEqual([]);
  });

  it("updates quantities and removes at zero", () => {
    const lines = [line("a-v", 2), line("b-v", 1)];
    expect(setLineQuantity(lines, "a-v", 7)[0].quantity).toBe(7);
    expect(setLineQuantity(lines, "a-v", 0)).toEqual([line("b-v", 1)]);
    expect(removeLine(lines, "b-v")).toEqual([line("a-v", 2)]);
    expect(countItems(lines)).toBe(3);
  });

  it("sanitises untrusted stored carts", () => {
    expect(sanitiseLines("nope")).toEqual([]);
    expect(
      sanitiseLines([
        line("a-v", 2),
        { productId: 1, variantId: "x", quantity: 1 },
        { productId: "b", variantId: "b-v", quantity: "3" },
        { productId: "c", variantId: "c-v", quantity: 2.9 },
        { productId: "d", variantId: "d-v", quantity: 999 },
        null,
      ]),
    ).toEqual([line("a-v", 2), { productId: "c", variantId: "c-v", quantity: 2 }, { productId: "d", variantId: "d-v", quantity: 24 }]);
  });
});
