import { Suspense } from "react";
import { ClosingCta } from "@/components/home/closing-cta";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
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
      <Marquee />
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
