import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { ProductCard } from "@/components/product/product-card";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { getCatalog, getStoreSettings } from "@/lib/commerce/catalog";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop natural wellness drinks",
  description:
    "Shop Naturo wellness shots, traditional Zimbabwean favourites like Maheu and Muvhee, and herbal teas and powders, proudly made in Zimbabwe.",
  alternates: { canonical: "/shop" },
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
        eyebrow="Shop Naturo"
        title="Natural goodness,"
        accent="bottled."
        intro="Wellness shots, traditional favourites and herbal blends, made for everyday life."
        motifs={["ginger", "hibiscus"]}
      />
      <Suspense fallback={<StaticCatalogue products={catalog} samplePricing={settings.samplePricing} />}>
        <ShopBrowser />
      </Suspense>
    </>
  );
}
