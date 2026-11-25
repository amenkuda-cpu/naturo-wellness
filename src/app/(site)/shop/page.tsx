import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { ProductCard } from "@/components/product/product-card";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { getCatalog, getStoreSettings } from "@/lib/commerce/catalog";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "Naturo Wellness Shop | Buy Wellness Shots in Zimbabwe" },
  description:
    "Shop Naturo Wellness shots made fresh in Harare: Ginger, Men's, Hibiscus, Glow and Pineapple, plus herbal teas, Maheu and cans. Delivery across Zimbabwe.",
  alternates: { canonical: "/shop" },
  openGraph: { url: "/shop", title: "Naturo Wellness Shop | Buy Wellness Shots in Zimbabwe" },
};

/**
 * Prerendered stand-in with the same layout as the interactive browser, so
 * the page doesn't shift when filters (which read the URL) hydrate.
 */
function StaticCatalogue({ products, samplePricing }: { products: Product[]; samplePricing: boolean }) {
  const ordered = [...products].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <div className="container-x pb-28" aria-busy="true">
      <div className="-mx-4 h-[189px] border-b border-forest/10 sm:-mx-7 sm:h-[133px] lg:-mx-12 lg:h-[77px]" />
      <h2 className="sr-only">Products</h2>
      <p className="mt-6 text-sm text-ink/70">{products.length} products</p>
      <ul className="mt-6 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
        {ordered.map((p, i) => (
          <li key={p.id}>
            <ProductCard product={p} index={products.indexOf(p)} samplePricing={samplePricing} priority={i < 4} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ShopPage() {
  const [catalog, settings] = await Promise.all([getCatalog(), getStoreSettings()]);
  return (
    <>
      <PageHero
        eyebrow="Shop Naturo Wellness"
        title="Natural goodness,"
        accent="bottled."
        intro="Wellness shots made fresh in Harare, plus herbal teas, traditional favourites and fruity cans. Order online or on WhatsApp, with delivery across Zimbabwe."
        motifs={["ginger", "hibiscus"]}
      />
      <Suspense fallback={<StaticCatalogue products={catalog} samplePricing={settings.samplePricing} />}>
        <ShopBrowser />
      </Suspense>
    </>
  );
}
