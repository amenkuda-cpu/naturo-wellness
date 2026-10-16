"use client";

import { Check, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { cart } from "@/components/cart/cart-store";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { isVariantPurchasable } from "@/lib/commerce/pricing";
import { cn } from "@/lib/cn";
import type { Product, ProductVariant } from "@/lib/types";

export function AddToCartButton({
  product,
  variant = product.variants[0],
  quantity = 1,
  size = "md",
  variantStyle = "primary",
  compact = false,
  className,
  openDrawer = true,
  tone = "dark",
}: {
  product: Product;
  variant?: ProductVariant;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  variantStyle?: "primary" | "sun" | "light" | "outline";
  compact?: boolean;
  className?: string;
  openDrawer?: boolean;
  /** Compact button colour: dark (forest) or light (for dark backgrounds). */
  tone?: "dark" | "light";
}) {
  const [added, setAdded] = useState(false);
  const purchasable = variant ? isVariantPurchasable(product, variant) : false;

  if (!purchasable) {
    if (compact) return null;
    const reason =
      variant?.stockStatus === "out_of_stock" || variant?.stockQuantity === 0 ? "Out of stock" : "Coming soon";
    return (
      <button
        type="button"
        disabled
        className={buttonClasses({ variant: "outline", size, className: cn("!opacity-60", className) })}
        aria-label={`${product.name}: ${reason.toLowerCase()}`}
      >
        {reason}
      </button>
    );
  }

  const onClick = () => {
    cart.add({ productId: product.id, variantId: variant!.id, quantity }, { open: openDrawer });
    track("add_to_cart", { product_id: product.id, variant_id: variant!.id, quantity, price: variant!.price });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Add ${product.name} to cart`}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full shadow-lg shadow-forest/20 transition-transform duration-300 hover:scale-105 active:scale-95",
          tone === "light" ? "bg-warm text-forest hover:bg-sun" : "bg-forest text-warm hover:bg-botanical",
          className,
        )}
      >
        {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className={buttonClasses({ variant: variantStyle, size, className })}>
      {added ? <Check className="h-4 w-4" aria-hidden /> : <ShoppingBag className="h-4 w-4" aria-hidden />}
      <ButtonLabel>{added ? "Added" : "Add to cart"}</ButtonLabel>
      <span className="sr-only" aria-live="polite">
        {added ? `${product.name} added to cart` : ""}
      </span>
    </button>
  );
}
