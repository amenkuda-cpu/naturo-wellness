import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { isDevSamplePrice } from "@/config/commerce";
import { PriceTag } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * A collection spotlight: the family group photo beside a compact grid of
 * every product in the collection, each linking to its page.
 */
export function CollectionFeature({
  id,
  eyebrow,
  title,
  accent,
  body,
  note,
  image,
  products,
  href,
  cta,
  bg,
  reverse = false,
  samplePricing,
}: {
  id: string;
  eyebrow: string;
  title: string;
  /** Word(s) set in the serif accent after the title. */
  accent: string;
  body: string;
  /** Small print under the copy (e.g. an 18+ notice). */
  note?: string;
  image: { src: string; alt: string; width: number; height: number };
  products: Product[];
  href: string;
  cta: string;
  bg: string;
  reverse?: boolean;
  samplePricing: boolean;
}) {
  if (products.length === 0) return null;
  const portrait = image.height > image.width;
  return (
    <Reveal as="section" aria-labelledby={`${id}-title`} className="cv-auto relative overflow-hidden py-24 lg:py-32" style={{ backgroundColor: bg }}>
      <div className="grain absolute inset-0" aria-hidden />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div data-reveal className={cn(portrait ? "lg:col-span-5" : "lg:col-span-6", reverse && "lg:order-2")}>
          <div className="overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgba(23,49,38,0.45)]">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes={portrait ? "(min-width: 1024px) 38vw, 92vw" : "(min-width: 1024px) 46vw, 92vw"}
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className={cn(portrait ? "lg:col-span-7" : "lg:col-span-6", reverse && "lg:order-1")}>
          <p data-reveal className="eyebrow text-botanical">
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} data-reveal className="display mt-4 text-[clamp(2.4rem,6vw,4.6rem)] text-forest">
            {title} <span className="serif-accent normal-case text-botanical">{accent}</span>
          </h2>
          <p data-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
            {body}
          </p>
          {note && (
            <p data-reveal className="mt-4 flex max-w-xl items-start gap-3 text-sm font-medium text-ink/80">
              <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[0.65rem] font-bold text-warm">18+</span>
              {note}
            </p>
          )}

          <ul
            data-reveal
            className={cn("mt-8 grid gap-3", products.length > 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}
            aria-label={`${title} ${accent}`}
          >
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/shop/${p.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-warm/70 p-2 ring-1 ring-forest/5 transition-colors hover:bg-warm"
                >
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-xl" style={{ backgroundColor: p.theme.tint }}>
                    <ProductImage
                      product={p}
                      sizes="(min-width: 1024px) 12vw, 40vw"
                      className="absolute inset-x-[10%] inset-y-[4%] transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-1.5"
                      imgClassName="[filter:drop-shadow(0_10px_10px_rgba(23,49,38,0.2))]"
                    />
                  </span>
                  <span className="mt-2 px-1 text-sm font-semibold leading-tight text-forest">{p.name}</span>
                  <span className="mt-auto px-1 pb-1 pt-1 text-sm">
                    <PriceTag product={p} sample={samplePricing && isDevSamplePrice(p.variants[0]?.id)} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            data-reveal
            href={href}
            className="group mt-8 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-forest"
          >
            <span className="link-underline">{cta}</span>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-forest text-warm transition-transform duration-500 group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
