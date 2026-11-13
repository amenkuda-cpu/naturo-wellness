import { Suspense } from "react";
import { ClosingCta } from "@/components/home/closing-cta";
import { CollectionFeature } from "@/components/home/collection-feature";
import { Hero } from "@/components/home/hero";
import { Moments } from "@/components/home/moments";
import { ProductShowcase } from "@/components/home/product-showcase";
import { RangeRail } from "@/components/home/range-rail";
import { Story } from "@/components/home/story";
import { Transparency } from "@/components/home/transparency";
import { getCatalog, getStoreSettings } from "@/lib/commerce/catalog";

export default async function HomePage() {
  const [catalog, settings] = await Promise.all([getCatalog(), getStoreSettings()]);
  // Each Suspense boundary is an independent hydration unit, so React can
  // hydrate the page in small chunks and keep the main thread responsive.
  return (
    <>
      <Hero />
      <Suspense>
        <ProductShowcase catalog={catalog} samplePricing={settings.samplePricing} />
      </Suspense>
      <Suspense>
        <Moments />
      </Suspense>
      <Suspense>
        <Story />
      </Suspense>
      <Suspense>
        <CollectionFeature
          id="cans"
          eyebrow="New · Naturo Cans"
          title="Best served"
          accent="with friends"
          body="Orange, Cranberry and Apple: three fruity drinks in ice-cold 330 ml cans, made for sharing."
          image={{
            src: "/images/collections/naturo-cans.webp",
            alt: "Naturo Wellness Orange, Cranberry and Apple flavour cans, 330 ml",
            width: 1536,
            height: 1024,
          }}
          products={catalog.filter((p) => p.category === "naturo-cans")}
          href="/shop?category=naturo-cans"
          cta="Shop Naturo Cans"
          bg="#F1EEE8"
          reverse
          samplePricing={settings.samplePricing}
        />
      </Suspense>
      <Suspense>
        <RangeRail products={catalog} samplePricing={settings.samplePricing} />
      </Suspense>
      <Suspense>
        <Transparency />
      </Suspense>
      <Suspense>
        <ClosingCta />
      </Suspense>
    </>
  );
}
