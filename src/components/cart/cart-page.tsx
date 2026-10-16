"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { useStore } from "@/components/providers/store-provider";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/commerce/pricing";
import { cart, useCart } from "./cart-store";
import { OrderSummary } from "./order-summary";
import { useQuote } from "./use-quote";

export function CartPageClient() {
  const { lines, hydrated } = useCart();
  const { byId, settings } = useStore();
  const { quote, verified, loading } = useQuote(lines);

  if (!hydrated) {
    return <div className="container-x py-24 text-ink/70">Loading your cart…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-24 text-center">
        <p className="font-display text-4xl font-extrabold uppercase text-forest">Your cart is empty</p>
        <p className="mx-auto mt-3 max-w-md text-ink/70">
          Start with a wellness shot, a traditional favourite or a comforting cup of tea.
        </p>
        <Link href="/shop" className={buttonClasses({ size: "lg", className: "mt-8" })}>
          <ButtonLabel>Shop Naturo</ButtonLabel>
        </Link>
      </div>
    );
  }

  const blocked = quote.lines.length === 0 || quote.issues.length > 0;

  return (
    <div className="container-x grid gap-10 pb-24 lg:grid-cols-12 lg:gap-14">
      <ul className="divide-y divide-forest/10 border-y border-forest/10 lg:col-span-7">
        {lines.map((line) => {
          const p = byId(line.productId);
          const v = p?.variants.find((x) => x.id === line.variantId);
          if (!p || !v) return null;
          const issue = quote.issues.find((i) => i.variantId === line.variantId);
          return (
            <li key={line.variantId} className="flex gap-4 py-6 sm:gap-6">
              <Link href={`/shop/${p.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-40 sm:w-32" style={{ backgroundColor: p.theme.tint }}>
                <ProductImage product={p} sizes="128px" className="absolute inset-2" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/shop/${p.slug}`} className="font-display text-xl font-bold text-forest hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-sm text-ink/70">{v.size ?? v.label}</p>
                    {v.price !== null && <p className="mt-1 text-sm tabular-nums">{formatMoney(v.price, p.currency)} each</p>}
                  </div>
                  <p className="font-semibold tabular-nums">{v.price !== null ? formatMoney(v.price * line.quantity, p.currency) : "—"}</p>
                </div>
                {issue && <p className="mt-2 text-sm font-medium text-hibiscus" role="alert">{issue.message}</p>}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityStepper
                    value={line.quantity}
                    max={settings.maxQuantityPerLine}
                    onChange={(q) => cart.setQuantity(line.variantId, q)}
                    label={`Quantity of ${p.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      cart.remove(line.variantId);
                      track("remove_from_cart", { product_id: p.id, variant_id: v.id });
                    }}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-ink/70 hover:bg-hibiscus/10 hover:text-hibiscus"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <OrderSummary quote={quote} verified={verified} loading={loading} showLines={false}>
            <Link
              href="/checkout"
              aria-disabled={blocked}
              onClick={(e) => blocked && e.preventDefault()}
              className={buttonClasses({ size: "lg", className: `mt-6 w-full ${blocked ? "pointer-events-none opacity-50" : ""}` })}
            >
              <ButtonLabel>Continue to checkout</ButtonLabel>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {blocked && <p className="mt-3 text-sm text-hibiscus">Please resolve the items marked above to continue.</p>}
            <Link href="/shop" className="mt-4 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink/70 hover:text-forest">
              Continue shopping
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
