"use client";

import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ProductImage } from "@/components/product/product-image";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { useStore } from "@/components/providers/store-provider";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { buildQuote, formatMoney } from "@/lib/commerce/pricing";
import { smoothScroll } from "@/lib/smooth-scroll";
import { cart, useCart } from "./cart-store";

export function CartDrawer() {
  const { open, lines } = useCart();
  const { catalog, settings, byId } = useStore();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const estimate = buildQuote({
    lines,
    catalog,
    deliveryFee: null,
    promotion: null,
    taxRateBps: settings.taxRateBps,
    pricesIncludeTax: settings.pricesIncludeTax,
    maxQuantityPerLine: settings.maxQuantityPerLine,
    currency: settings.currency,
  });

  // Close on route changes only. Not on mount, which can happen just after
  // an add-to-cart opened the drawer (this component hydrates lazily).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      cart.close();
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    smoothScroll.stop();
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cart.close();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      smoothScroll.start();
      document.body.style.overflow = "";
      restoreRef.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-forest-900/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => cart.close()}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            data-lenis-prevent
            className="absolute inset-y-0 right-0 flex w-full max-w-[28rem] flex-col bg-warm shadow-2xl sm:rounded-l-[2rem]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-7">
              <h2 id="cart-title" className="font-display text-2xl font-extrabold uppercase tracking-tight">
                Your cart <span className="font-sans text-base font-medium text-ink/70">({estimate.itemCount})</span>
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => cart.close()}
                className="grid h-11 w-11 place-items-center rounded-full hover:bg-forest/5"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {lines.length === 0 ? (
              <EmptyCart />
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-7">
                  <AnimatePresence initial={false}>
                    {lines.map((line, i) => {
                      const product = byId(line.productId);
                      const variant = product?.variants.find((v) => v.id === line.variantId);
                      if (!product || !variant) return null;
                      const issue = estimate.issues.find((x) => x.variantId === line.variantId);
                      return (
                        <motion.li
                          key={line.variantId}
                          layout
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.05 } }}
                          exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                          className="flex gap-4 rounded-2xl bg-cream/70 p-3"
                        >
                          <Link
                            href={`/shop/${product.slug}`}
                            className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl"
                            style={{ backgroundColor: product.theme.tint }}
                            tabIndex={-1}
                            aria-hidden
                          >
                            <ProductImage product={product} sizes="80px" className="absolute inset-1" />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link href={`/shop/${product.slug}`} className="font-semibold leading-tight hover:underline">
                                  {product.name}
                                </Link>
                                <p className="text-xs text-ink/70">{variant.size ?? variant.label}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  cart.remove(line.variantId);
                                  track("remove_from_cart", { product_id: product.id, variant_id: variant.id });
                                }}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/70 hover:bg-hibiscus/10 hover:text-hibiscus"
                                aria-label={`Remove ${product.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                              <QuantityStepper
                                size="sm"
                                value={line.quantity}
                                max={settings.maxQuantityPerLine}
                                onChange={(q) => cart.setQuantity(line.variantId, q)}
                                label={`Quantity of ${product.name}`}
                              />
                              <span className="text-sm font-semibold tabular-nums">
                                {variant.price !== null ? formatMoney(variant.price * line.quantity, product.currency) : ""}
                              </span>
                            </div>
                            {issue && <p className="mt-2 text-xs font-medium text-hibiscus">{issue.message}</p>}
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-ink/10 bg-cream/60 px-5 pb-6 pt-4 sm:px-7">
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(estimate.subtotal, estimate.currency)}</dd>
                    </div>
                    <div className="flex justify-between text-ink/70">
                      <dt>Delivery</dt>
                      <dd>Calculated at checkout</dd>
                    </div>
                  </dl>
                  {settings.samplePricing && (
                    <p className="mt-2 rounded-lg bg-ember/15 px-3 py-2 text-xs text-[#8a420a]">
                      Development preview: sample prices only.
                    </p>
                  )}
                  <Link
                    href="/checkout"
                    className={buttonClasses({ size: "lg", className: "mt-4 w-full" })}
                    aria-disabled={estimate.lines.length === 0}
                    onClick={(e) => {
                      if (estimate.lines.length === 0) e.preventDefault();
                    }}
                  >
                    <ButtonLabel>Checkout</ButtonLabel>
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link href="/cart" className="mt-3 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink/70 hover:text-forest">
                    View full cart
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-citrus/60">
        <ShoppingBag className="h-8 w-8 text-forest" />
      </div>
      <p className="mt-6 font-display text-2xl font-bold">Your cart is empty</p>
      <p className="mt-2 max-w-xs text-sm text-ink/75">Start with a wellness shot, a traditional favourite or a comforting cup.</p>
      <Link href="/shop" className={buttonClasses({ className: "mt-6" })}>
        <ButtonLabel>Shop Naturo</ButtonLabel>
      </Link>
    </div>
  );
}
