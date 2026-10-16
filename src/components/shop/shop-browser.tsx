"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { useStore } from "@/components/providers/store-provider";
import { moments } from "@/data/moments";
import { categories } from "@/data/products";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { fromPrice, isProductPurchasable } from "@/lib/commerce/pricing";
import type { CategoryId } from "@/lib/types";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "name", label: "Name A–Z" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

export function ShopBrowser() {
  const { catalog, settings } = useStore();
  const pathname = usePathname();
  const params = useSearchParams();

  const category = (params.get("category") as CategoryId | null) ?? null;
  const moment = params.get("moment");
  const sort = (params.get("sort") as SortId | null) ?? "featured";
  const available = params.get("available") === "1";
  const [query, setQuery] = useState(params.get("q") ?? "");

  const setParam = (key: string, value: string | null) => {
    // Read the live URL so rapid successive updates never resurrect stale params.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    // Native history updates are synchronous and integrate with useSearchParams,
    // so rapid filter changes can never race each other.
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
  };

  // Debounce search → URL.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== query.trim()) setParam("q", query.trim() || null);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (category) track("category_view", { category });
  }, [category]);

  const activeMoment = moments.find((m) => m.id === moment) ?? null;

  const results = useMemo(() => {
    const q = (params.get("q") ?? "").trim().toLowerCase();
    let list = catalog.filter((p) => {
      if (category && p.category !== category) return false;
      if (activeMoment && !activeMoment.productSlugs.includes(p.slug)) return false;
      if (available && !isProductPurchasable(p)) return false;
      if (q) {
        const hay = [p.name, p.shortDescription, p.mood, ...p.tags, ...(p.ingredients ?? [])].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const price = (p: (typeof list)[number]) => fromPrice(p);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
        case "price-desc": {
          const pa = price(a);
          const pb = price(b);
          if (pa === null && pb === null) return 0;
          if (pa === null) return 1; // unpriced always last
          if (pb === null) return -1;
          return sort === "price-asc" ? pa - pb : pb - pa;
        }
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });
    return list;
  }, [catalog, category, activeMoment, available, sort, params]);

  const clearAll = () => {
    setQuery("");
    window.history.replaceState(null, "", pathname);
  };
  const hasFilters = Boolean(category || moment || available || params.get("q"));

  return (
    <div className="container-x pb-28">
      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-4 min-h-[189px] border-b sm:min-h-[133px] lg:min-h-[77px] border-forest/10 bg-warm/90 px-4 py-4 backdrop-blur-xl sm:top-20 sm:-mx-7 sm:px-7 lg:-mx-12 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Product categories" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {[{ id: null, name: "All" }, ...categories].map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id ?? "all"}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setParam("category", c.id)}
                  className={cn(
                    "relative h-10 shrink-0 rounded-full px-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                    active ? "text-warm" : "text-forest hover:bg-forest/5",
                  )}
                >
                  {active && (
                    <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                  <span className="relative">{c.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative basis-full sm:basis-auto sm:flex-1 lg:w-72 lg:flex-none">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/70" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ginger, tea, maheu…"
                className="field h-11 !rounded-full !py-0 pl-11"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Sort products</span>
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/70" aria-hidden />
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
                className="field h-11 cursor-pointer appearance-none !rounded-full !py-0 pl-11 pr-8 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 text-sm">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setParam("available", e.target.checked ? "1" : null)}
                className="h-4 w-4 accent-[#367A45]"
              />
              Ready to order
            </label>
          </div>
        </div>
        {(activeMoment || hasFilters) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {activeMoment && (
              <button
                onClick={() => setParam("moment", null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-citrus px-3 py-1.5 font-medium text-forest"
              >
                {activeMoment.title} <X className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </button>
            )}
            {hasFilters && (
              <button onClick={clearAll} className="text-ink/70 underline underline-offset-4 hover:text-forest">
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <h2 className="sr-only">Products</h2>
      <p className="mt-6 text-sm text-ink/70" aria-live="polite">
        {results.length} {results.length === 1 ? "product" : "products"}
      </p>

      {results.length === 0 ? (
        <div className="mt-10 rounded-[2rem] bg-cream px-6 py-20 text-center">
          <p className="font-display text-3xl font-bold text-forest">Nothing matches just yet.</p>
          <p className="mt-2 text-ink/75">Try a different search or clear your filters.</p>
          <button onClick={clearAll} className="mt-6 rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-warm">
            Show all products
          </button>
        </div>
      ) : (
        <motion.ul layout className="mt-6 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
              >
                <ProductCard product={p} index={catalog.indexOf(p)} samplePricing={settings.samplePricing} priority={i < 4} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
