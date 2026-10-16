import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/types";

/** Horizontal, snap-scrolling range of products (featured first). */
export function RangeRail({ products, samplePricing }: { products: Product[]; samplePricing: boolean }) {
  const ordered = [...products].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <Reveal as="section" aria-labelledby="range-title" className="cv-auto relative overflow-hidden bg-cream py-24 lg:py-32">
      <div className="container-x flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div data-reveal>
          <p className="eyebrow text-botanical">The full range</p>
          <h2 id="range-title" className="display mt-4 text-[clamp(2.4rem,6vw,5rem)] text-forest">
            Pick your <span className="serif-accent normal-case text-botanical">favourites</span>
          </h2>
        </div>
        <Link
          data-reveal
          href="/shop"
          className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-forest"
        >
          <span className="link-underline">Shop all products</span>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-forest text-warm transition-transform duration-500 group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
      <ul
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-7 lg:gap-8 lg:px-12 [scroll-padding-inline:1rem] sm:[scroll-padding-inline:1.75rem] lg:[scroll-padding-inline:3rem]"
        aria-label="Naturo products"
      >
        {ordered.map((p, i) => (
          <li key={p.id} data-reveal className="w-[74vw] shrink-0 snap-start sm:w-[42vw] lg:w-[24vw] xl:w-[21vw]">
            <ProductCard product={p} index={i} samplePricing={samplePricing} />
          </li>
        ))}
        <li aria-hidden className="w-1 shrink-0" />
      </ul>
    </Reveal>
  );
}
