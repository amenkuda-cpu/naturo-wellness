import type { CSSProperties } from "react";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/cn";
import type { PackagingShape, Product } from "@/lib/types";

/**
 * Where the hanging line meets the product, as a fraction of image height,
 * for the current placeholder artwork. Adjust when final photos arrive.
 */
const HANG_POINT: Record<PackagingShape, number> = { shot: 0.125, tall: 0.173, pouch: 0.163 };

/**
 * A product suspended from a fine line. The pivot sits at the anchor's
 * top-left corner, so rotating the anchor swings the bottle naturally.
 *
 * Nested transform layers (never animate one element from two systems):
 *   [data-pendulum] entrance/scroll → [data-sway] ambient → [data-tilt] pointer
 *
 * Size it with CSS variables in `className`: --len (line length) and --h (bottle height).
 */
export function HangingBottle({
  product,
  className,
  style,
  priority,
  sizes = "(min-width: 1024px) 30vw, 60vw",
  shadow = true,
  lineClassName = "bg-ink/20 lg:bg-ink/40",
  depthBlur,
  lineFromAnchor = false,
}: {
  product: Pick<Product, "images" | "name" | "packaging">;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
  shadow?: boolean;
  lineClassName?: string;
  /** Depth-of-field blur class, applied to the static image layer (cheap to composite). */
  depthBlur?: string;
  /** Start the string at the anchor (e.g. a branch) instead of off-screen above. */
  lineFromAnchor?: boolean;
}) {
  const hang = HANG_POINT[product.packaging];
  return (
    <div data-pendulum className={cn("absolute top-0 h-0 w-0", className)} style={{ transformOrigin: "0 0", ...style }}>
      <div data-sway className="absolute left-0 top-0" style={{ transformOrigin: "0 0" }}>
        <div data-tilt className="absolute left-0 top-0" style={{ transformOrigin: "0 0" }}>
          <span
            aria-hidden
            className={cn("absolute left-0 w-px -translate-x-1/2", lineClassName)}
            style={lineFromAnchor ? { top: 0, height: "var(--len)" } : { top: "-120vh", height: "calc(120vh + var(--len))" }}
          />
          <ProductImage
            product={product}
            priority={priority}
            sizes={sizes}
            className="absolute left-0 aspect-[2/3] -translate-x-1/2"
            style={{ height: "var(--h)", top: `calc(var(--len) - var(--h) * ${hang})` }}
            imgClassName={depthBlur ?? (shadow ? "[filter:drop-shadow(0_30px_28px_rgba(23,49,38,0.28))]" : undefined)}
          />
        </div>
      </div>
    </div>
  );
}

