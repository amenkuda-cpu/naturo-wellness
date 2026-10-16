"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cart } from "@/components/cart/cart-store";
import { useStore } from "@/components/providers/store-provider";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatMoney, isVariantPurchasable } from "@/lib/commerce/pricing";
import type { Product } from "@/lib/types";
import { PriceTag, StockBadge } from "./price";
import { QuantityStepper } from "./quantity-stepper";

/**
 * Size, quantity and purchase actions. Reads the live catalogue entry so the
 * price shown matches what the server will charge.
 */
export function PurchasePanel({ slug }: { slug: string }) {
  const { catalog, settings } = useStore();
  const product = catalog.find((p) => p.slug === slug) as Product;
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [showBar, setShowBar] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const purchasable = variant ? isVariantPurchasable(product, variant) : false;
  const maxQty = Math.min(settings.maxQuantityPerLine, variant?.stockQuantity ?? Infinity);

  useEffect(() => {
    track("product_view", { product_id: product.id, category: product.category });
  }, [product.id, product.category]);

  // Mobile sticky bar appears once the main button scrolls out of view.
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = (goToCheckout = false) => {
    if (!variant || !purchasable) return;
    cart.add({ productId: product.id, variantId: variant.id, quantity: qty }, { open: !goToCheckout });
    track("add_to_cart", { product_id: product.id, variant_id: variant.id, quantity: qty, price: variant.price });
    if (goToCheckout) router.push("/checkout");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PriceTag
          product={product}
          variant={variant}
          className="font-display text-3xl"
          sample={settings.samplePricing && variant?.price !== null}
        />
        {variant && <StockBadge status={variant.stockStatus} />}
      </div>

      {product.variants.length > 1 && (
        <fieldset className="mt-6">
          <legend className="eyebrow text-ink/70">Size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-botanical",
                  v.id === variantId ? "border-forest bg-forest text-warm" : "border-ink/20 hover:border-forest",
                )}
              >
                <input type="radio" name="variant" value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} className="sr-only" />
                {v.size ?? v.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {product.variants.length === 1 && (
        <p className="mt-3 text-sm text-ink/75">
          Size: {variant?.size ?? <span className="italic">to be confirmed</span>}
        </p>
      )}

      <div ref={anchorRef} className="mt-7 flex flex-wrap items-center gap-3">
        {purchasable ? (
          <>
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, maxQty)} label={`Quantity of ${product.name}`} />
            <button type="button" onClick={() => add()} className={buttonClasses({ size: "lg", className: "flex-1 sm:flex-none" })}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              <ButtonLabel>Add to cart</ButtonLabel>
            </button>
            <button type="button" onClick={() => add(true)} className={buttonClasses({ variant: "sun", size: "lg", className: "w-full sm:w-auto" })}>
              <ButtonLabel>Buy now</ButtonLabel>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : (
          <div className="w-full rounded-2xl bg-cream p-5">
            <p className="font-semibold text-forest">
              {variant?.stockStatus === "out_of_stock" ? "Currently out of stock" : "Coming soon to our online shop"}
            </p>
            <p className="mt-1 text-sm text-ink/70">
              {variant?.price === null
                ? "Pricing for this product will be published shortly. Contact us if you'd like to order in the meantime."
                : "Check back soon, or contact us to ask about availability."}
            </p>
          </div>
        )}
      </div>

      {/* Mobile sticky purchase bar */}
      {purchasable && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 border-t border-forest/10 bg-warm/95 px-4 py-3 backdrop-blur-xl transition-transform duration-500 ease-[var(--ease-expo)] lg:hidden",
            showBar ? "translate-y-0" : "translate-y-full",
          )}
          aria-hidden={!showBar}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{product.name}</p>
              <p className="text-sm tabular-nums text-ink/70">{variant?.price != null && formatMoney(variant.price * qty, product.currency)}</p>
            </div>
            <button type="button" tabIndex={showBar ? 0 : -1} onClick={() => add()} className={buttonClasses({ size: "md" })}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Add {qty > 1 ? `(${qty})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
