"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { buildQuote, type Quote } from "@/lib/commerce/pricing";
import type { CartLine, FulfilmentMethod } from "@/lib/types";

/**
 * Returns a local estimate immediately, then replaces it with the server's
 * authoritative quote (fresh prices, stock, delivery fee and promo checks).
 */
export function useQuote(
  lines: CartLine[],
  opts: { fulfilment?: { method: FulfilmentMethod; zoneId?: string }; promoCode?: string } = {},
) {
  const { catalog, settings } = useStore();
  const [server, setServer] = useState<{ quote: Quote; fulfilmentError: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const estimate = useMemo(
    () =>
      buildQuote({
        lines,
        catalog,
        deliveryFee: null,
        promotion: null,
        taxRateBps: settings.taxRateBps,
        pricesIncludeTax: settings.pricesIncludeTax,
        maxQuantityPerLine: settings.maxQuantityPerLine,
        currency: settings.currency,
      }),
    [lines, catalog, settings],
  );

  const key = JSON.stringify({ lines, f: opts.fulfilment, p: opts.promoCode });

  useEffect(() => {
    if (lines.length === 0) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: lines, fulfilment: opts.fulfilment, promoCode: opts.promoCode || undefined }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        setServer(await res.json());
        setFailed(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailed(true);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = lines.length ? server : null;
  return {
    quote: current?.quote ?? estimate,
    verified: Boolean(current) && !loading,
    fulfilmentError: current?.fulfilmentError ?? null,
    loading,
    failed,
  };
}
