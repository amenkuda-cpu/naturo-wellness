"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { META_EXCLUDED_PATH, metaPixel } from "@/config/meta";
import { metaTrack } from "@/lib/meta-pixel";

/**
 * Client half of the Meta Pixel (the base code itself is in the site layout):
 * - PageView on every client-side route change (Next.js App Router),
 * - Contact when a WhatsApp link is clicked anywhere on the site.
 */
export function MetaPixelEvents() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();

  useEffect(() => {
    if (!metaPixel.enabled || META_EXCLUDED_PATH.test(pathname)) return;
    const page = pathname + (query ? `?${query}` : "");
    // The base code already reported this page (full load); never count a page twice.
    if (window.__naturoPixelLastPage === page) return;
    if (!window.fbq) {
      // Landed on an excluded page first: start the pixel now (it sends this PageView).
      window.__naturoPixelInit?.();
      return;
    }
    window.__naturoPixelLastPage = page;
    try {
      window.fbq("track", "PageView");
    } catch {
      // ignore
    }
  }, [pathname, query]);

  useEffect(() => {
    if (!metaPixel.enabled) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      if (/^(https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\/|whatsapp:)/i.test(a.href)) {
        metaTrack("Contact", { method: "WhatsApp" });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
