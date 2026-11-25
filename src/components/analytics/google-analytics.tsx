"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { META_EXCLUDED_PATH } from "@/config/meta";
import { ga4 } from "@/config/ga4";
import { ga4Snippet } from "@/lib/ga4";

/**
 * Loads GA4 (gtag.js) once the page has loaded, only when NEXT_PUBLIC_GA4_ID is set.
 * Never loads on /order (its URL carries a private access token), /admin or /rider.
 */
export function GoogleAnalytics() {
  const pathname = usePathname() ?? "/";
  if (!ga4.enabled || META_EXCLUDED_PATH.test(pathname)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4.id}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload">
        {ga4Snippet({ pageView: true })}
      </Script>
    </>
  );
}
