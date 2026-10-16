import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Motif, Product } from "@/lib/types";

/** Adds `relative` only when the caller hasn't positioned the element itself. */
const positioned = (className?: string) => (/(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className ?? "") ? "" : "relative");

/**
 * Renders a product's primary image inside a fixed-ratio box with
 * object-contain, so a differently proportioned final photo still fits.
 */
export function ProductImage({
  product,
  className,
  sizes = "(min-width: 1024px) 30vw, 60vw",
  priority = false,
  showPlaceholderNotice = false,
  imgClassName,
  style,
}: {
  product: Pick<Product, "images" | "name">;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showPlaceholderNotice?: boolean;
  imgClassName?: string;
  style?: React.CSSProperties;
}) {
  const img = product.images[0];
  return (
    <div className={cn(positioned(className), className)} style={style}>
      {img ? (
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes={sizes}
          preload={priority}
          draggable={false}
          className={cn("object-contain select-none", imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center rounded-3xl bg-cream text-sm text-ink/70">
          Image coming soon
        </div>
      )}
      {showPlaceholderNotice && img?.placeholder && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-warm/85 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ink/70 backdrop-blur">
          Placeholder artwork
        </span>
      )}
    </div>
  );
}

/** Decorative ingredient artwork (empty alt: purely visual). */
export function MotifImage({
  motif,
  className,
  sizes = "160px",
  priority,
}: {
  motif: Motif;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("pointer-events-none aspect-square", positioned(className), className)} aria-hidden>
      <Image
        src={`/images/ingredients/${motif}.webp`}
        alt=""
        fill
        sizes={sizes}
        preload={priority}
        draggable={false}
        className="object-contain select-none"
      />
    </div>
  );
}
