"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { cart } from "@/components/cart/cart-store";
import type { StoreSettings } from "@/lib/commerce/catalog";
import type { Product } from "@/lib/types";

interface StoreContextValue {
  catalog: Product[];
  settings: StoreSettings;
  byId: (id: string) => Product | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  catalog,
  settings,
  children,
}: {
  catalog: Product[];
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  const value = useMemo<StoreContextValue>(() => {
    const map = new Map(catalog.map((p) => [p.id, p]));
    return { catalog, settings, byId: (id) => map.get(id) };
  }, [catalog, settings]);

  useEffect(() => {
    cart.prune(new Set(catalog.flatMap((p) => p.variants.map((v) => v.id))));
  }, [catalog]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
