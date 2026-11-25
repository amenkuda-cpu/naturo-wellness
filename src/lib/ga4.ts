import { META_EXCLUDED_PATH } from "@/config/meta";
import { ga4 } from "@/config/ga4";

/**
 * GA4 e-commerce events (view_item, add_to_cart, begin_checkout, purchase). Every call is a
 * no-op when GA4 is off, on private pages (/order, /admin, /rider), or if gtag is blocked.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function ga4Event(name: string, params: Record<string, unknown>) {
  if (!ga4.enabled || typeof window === "undefined") return;
  if (META_EXCLUDED_PATH.test(window.location.pathname)) return;
  try {
    window.gtag?.("event", name, { currency: ga4.currency, ...params });
  } catch {
    // Tracking must never break shopping.
  }
}

/** Inline gtag bootstrap (used by the site layout and by the purchase bridge page). */
export function ga4Snippet(opts: { pageView: boolean; pageLocation?: string }) {
  const config = { send_page_view: opts.pageView, ...(opts.pageLocation ? { page_location: opts.pageLocation } : {}) };
  return [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    "window.gtag=gtag;",
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(ga4.id)},${JSON.stringify(config)});`,
  ].join("");
}
