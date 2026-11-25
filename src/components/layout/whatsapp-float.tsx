"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/cart-store";
import { useStore } from "@/components/providers/store-provider";
import { siteConfig } from "@/config/site";
import { metaTrack } from "@/lib/meta-pixel";

/**
 * Floating "Order on WhatsApp" button on every storefront page, for customers who would rather
 * chat than check out online. The message is pre-filled with the product they are viewing or
 * what is in their cart. Hidden on the order confirmation page, which has its own button.
 */
export function WhatsAppFloat() {
  const pathname = usePathname() ?? "/";
  const { lines } = useCart();
  const { catalog, byId } = useStore();
  // The home hero has its own WhatsApp button and controls in this corner: show the float once past it.
  const pastHero = useSyncExternalStore(subscribeScroll, () => window.scrollY > window.innerHeight * 0.7, () => false);
  if (pathname.startsWith("/order/")) return null;
  const hidden = pathname === "/" && !pastHero;

  const productSlug = /^\/shop\/([^/]+)$/.exec(pathname)?.[1];
  const product = productSlug ? catalog.find((p) => p.slug === productSlug) : undefined;
  const cartText = lines
    .map((l) => {
      const p = byId(l.productId);
      const v = p?.variants.find((x) => x.id === l.variantId);
      return p ? `- ${l.quantity} x ${p.name}${v && p.variants.length > 1 ? ` (${v.label})` : ""}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const text = cartText
    ? `Hi Naturo, I'd like to order:\n${cartText}`
    : product
      ? `Hi Naturo, I'd like to order ${product.name}.`
      : "Hi Naturo, I'd like to place an order.";
  const href = `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  // Product pages have a sticky "Add to cart" bar on phones; sit above it.
  const lift = product ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => metaTrack("Contact", { content_name: "WhatsApp" })}
      aria-label="Order or ask us on WhatsApp"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className={`fixed right-4 ${hidden ? "pointer-events-none translate-y-24 opacity-0" : "opacity-100"} duration-300 z-[55] inline-flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3.5 pr-4 text-sm font-semibold text-[#0b2e17] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:right-6 ${lift}`}
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.6s] [animation-iteration-count:3] motion-reduce:hidden" aria-hidden />
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 9.43 9.45c0 5.21-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.7l6.1-1.6a11.3 11.3 0 0 0 5.37 1.37h.01c6.26 0 11.36-5.1 11.36-11.37 0-3.03-1.18-5.89-3.33-8.03" />
      </svg>
      <span>Order on WhatsApp</span>
    </a>
  );
}

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}
