"use client";

import { Loader2 } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { useStore } from "@/components/providers/store-provider";
import { formatMoney, type Quote } from "@/lib/commerce/pricing";

/** Order totals panel shared by the cart and checkout pages. */
export function OrderSummary({
  quote,
  verified,
  loading,
  showLines = true,
  deliveryLabel = "Calculated at checkout",
  children,
}: {
  quote: Quote;
  verified: boolean;
  loading?: boolean;
  showLines?: boolean;
  deliveryLabel?: string | null;
  children?: React.ReactNode;
}) {
  const { byId, settings } = useStore();
  const money = (v: number) => formatMoney(v, quote.currency);
  return (
    <section aria-labelledby="summary-title" className="rounded-[2rem] bg-cream p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 id="summary-title" className="font-display text-2xl font-extrabold uppercase tracking-tight text-forest">
          Order summary
        </h2>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-ink/70" aria-label="Updating totals" />}
      </div>

      {showLines && quote.lines.length > 0 && (
        <ul className="mt-6 space-y-4">
          {quote.lines.map((l) => {
            const p = byId(l.productId);
            return (
              <li key={l.variantId} className="flex items-center gap-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: p?.theme.tint ?? "#F5F0DF" }}>
                  {p && <ProductImage product={p} sizes="56px" className="absolute inset-1" />}
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[0.65rem] font-bold text-warm">
                    {l.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="text-xs text-ink/70">{l.variantLabel}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{money(l.lineTotal)}</p>
              </li>
            );
          })}
        </ul>
      )}

      <dl className="mt-6 space-y-2 border-t border-forest/10 pt-5 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{money(quote.subtotal)}</dd>
        </div>
        {quote.discount > 0 && (
          <div className="flex justify-between text-botanical">
            <dt>Discount {quote.promotionCode && <span className="font-semibold">({quote.promotionCode})</span>}</dt>
            <dd className="tabular-nums">−{money(quote.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd className="tabular-nums">
            {deliveryLabel ?? (quote.deliveryFee > 0 ? money(quote.deliveryFee) : "Free")}
          </dd>
        </div>
        {quote.tax > 0 && (
          <div className="flex justify-between text-ink/75">
            <dt>{quote.taxIncluded ? "Includes tax" : "Tax"}</dt>
            <dd className="tabular-nums">{money(quote.tax)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-forest/10 pt-4">
          <dt className="font-display text-lg font-bold text-forest">Total</dt>
          <dd className="font-display text-2xl font-bold tabular-nums text-forest">{money(quote.total)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ink/70">
        {verified ? "Prices confirmed by our server." : "Estimated. Final total is confirmed when you place your order."}
        {settings.samplePricing && " Development preview: sample prices only."}
      </p>
      {children}
    </section>
  );
}
