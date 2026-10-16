import Link from "next/link";
import { categoryById } from "@/data/products";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "./add-to-cart";
import { PriceTag, StockBadge } from "./price";
import { MotifImage, ProductImage } from "./product-image";

export function ProductCard({
  product,
  index,
  samplePricing = false,
  className,
  priority,
}: {
  product: Product;
  index?: number;
  samplePricing?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const variant = product.variants[0];
  const priced = variant?.price !== null && variant?.price !== undefined;
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div
        className="relative isolate aspect-[4/5] overflow-hidden rounded-[1.75rem]"
        style={{ backgroundColor: product.theme.tint }}
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-[58%] -z-10 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-110"
          style={{ background: `radial-gradient(circle, ${product.theme.accent}55 0%, transparent 70%)` }}
        />
        <MotifImage
          motif={product.motifs[0]}
          className="absolute -right-[8%] top-[8%] w-[38%] rotate-12 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:rotate-[24deg] group-hover:scale-110"
        />
        <MotifImage
          motif={product.motifs[1] ?? product.motifs[0]}
          className="absolute -left-[6%] bottom-[10%] w-[30%] -rotate-12 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-rotate-[22deg] group-hover:-translate-y-2"
        />
        <ProductImage
          product={product}
          priority={priority}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 80vw"
          className="absolute inset-x-[14%] bottom-[4%] top-[6%] transition-transform duration-700 ease-[var(--ease-expo)] [filter:drop-shadow(0_24px_24px_rgba(23,49,38,0.22))] group-hover:-translate-y-3 group-hover:-rotate-2"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {typeof index === "number" && (
            <span className="eyebrow rounded-full bg-warm/80 px-2.5 py-1 text-[0.6rem] text-ink/80 backdrop-blur">
              Nº {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          <AddToCartButton product={product} compact />
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="eyebrow text-[0.62rem] text-ink/70">{categoryById(product.category).shortName}</p>
          <h3 className="mt-1 font-display text-xl font-bold leading-tight tracking-tight">
            <Link href={`/shop/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink/70">{product.shortDescription}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-sm">
        <PriceTag product={product} sample={samplePricing && priced} />
        {variant && <StockBadge status={variant.stockStatus} />}
      </div>
    </article>
  );
}
