import { Suspense } from "react";
import { ClosingCta } from "@/components/home/closing-cta";
import { CollectionFeature } from "@/components/home/collection-feature";
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
        <CollectionFeature
          id="teas"
          eyebrow="New · The herbal tea collection"
          title="Seven teas,"
          accent="one calm cup"
          body="From warming Ginger Lemon to the deep blue of Indongo Bloom, every pouch holds 20 tea bags of 100% natural herbal tea. Pick a favourite, or collect all seven."
          image={{
            src: "/images/collections/herbal-teas.webp",
            alt: "The seven Naturo Wellness herbal tea pouches: Ginger Lemon, Carrot, Muvheyi, Hibiscus, Green Focus, Indongo Bloom and Sunset Glow",
            width: 1024,
            height: 1536,
          }}
          products={catalog.filter((p) => p.category === "teas-and-powders" && !p.images[0]?.placeholder)}
          href="/shop?category=teas-and-powders"
          cta="Shop all herbal teas"
          bg="#FBF0C4"
          samplePricing={settings.samplePricing}
        />
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
          body="Orange, Cranberry and Apple: three fruity 5.2% alc./vol. drinks in ice-cold 330 ml cans, made for sharing."
          note="Contains alcohol. Only sold to adults aged 18 and over. Please enjoy responsibly."
          image={{
            src: "/images/collections/naturo-cans.webp",
            alt: "Naturo Wellness Orange, Cranberry and Apple flavour cans, 330 ml, 5.2% alc./vol.",
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
