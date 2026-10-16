"use client";

/**
 * Provider-agnostic analytics. Choose a provider with
 * NEXT_PUBLIC_ANALYTICS_PROVIDER = "none" | "gtm" | "plausible" | "console".
 * Never pass personal or payment data here: only product/cart metadata.
 */
export type AnalyticsEvent =
  | "product_view"
  | "category_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "payment_failed"
  | "coupon_applied";

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    plausible?: (event: string, opts?: { props?: Props }) => void;
  }
}

const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "none";

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    switch (provider) {
      case "gtm":
        (window.dataLayer ??= []).push({ event, ...props });
        break;
      case "plausible":
        window.plausible?.(event, { props });
        break;
      case "console":
        console.info("[analytics]", event, props);
        break;
      default:
        break;
    }
  } catch {
    // Analytics must never break the shopping experience.
  }
}
